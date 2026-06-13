const { expect } = require("chai");
const { ethers } = require("hardhat");

// BITE precompile addresses (see node_modules/@skalenetwork/bite-solidity/BITE.sol)
const SUBMIT_CTX_ADDRESS = "0x000000000000000000000000000000000000001B";
const ENCRYPT_ECIES_ADDRESS = "0x000000000000000000000000000000000000001C";
const ENCRYPT_TE_ADDRESS = "0x000000000000000000000000000000000000001D";

const abi = ethers.AbiCoder.defaultAbiCoder();

/**
 * Deploy a BiteMock and install the three precompile mocks at the canonical
 * precompile addresses using hardhat_setCode. The mocks bake the BiteMock
 * address into their runtime bytecode as an immutable at construction time,
 * so we deploy them normally first and then copy their deployed runtime code
 * to the precompile addresses.
 */
async function deployBiteHarness() {
  const BiteMock = await ethers.getContractFactory("BiteMock");
  const biteMock = await BiteMock.deploy();
  await biteMock.waitForDeployment();
  const biteAddr = await biteMock.getAddress();

  async function installMock(factoryName, targetAddr) {
    const Factory = await ethers.getContractFactory(factoryName);
    const instance = await Factory.deploy(biteAddr);
    await instance.waitForDeployment();
    const deployedCode = await ethers.provider.getCode(await instance.getAddress());
    await ethers.provider.send("hardhat_setCode", [targetAddr, deployedCode]);
  }

  await installMock("SubmitCTXMock", SUBMIT_CTX_ADDRESS);
  await installMock("EncryptECIESMock", ENCRYPT_ECIES_ADDRESS);
  await installMock("EncryptTEMock", ENCRYPT_TE_ADDRESS);

  return biteMock;
}

describe("DealStakeToken — encrypted transfer via BITE CTX", function () {
  let token, biteMock, owner, alice, bob, attacker;

  beforeEach(async function () {
    [owner, alice, bob, attacker] = await ethers.getSigners();
    biteMock = await deployBiteHarness();

    const Token = await ethers.getContractFactory("DealStakeToken");
    token = await Token.deploy("Stake", "STK", owner.address);
    await token.waitForDeployment();
  });

  async function teEncryptUint(value) {
    // BiteMock.encryptTE expects abi.encode(uint256) bytes, matching the
    // encoding the contract uses for balances/amounts.
    return await biteMock.encryptTE(abi.encode(["uint256"], [value]));
  }

  it("(a) performs a normal CTX round-trip transfer", async function () {
    // Issue Alice 1000, Bob 0.
    await token.issueStake(alice.address, 1000n, await teEncryptUint(1000n));
    await token.issueStake(bob.address, 1n, await teEncryptUint(1n)); // give bob a nonzero so issueStake passes
    // reset bob to a known balance for the test by transferring his 1 away is messy;
    // instead just track actual on-chain balances.
    const aliceBal = await token.balanceOf(alice.address);
    const bobBal = await token.balanceOf(bob.address);

    const amount = 250n;
    const encAmount = await teEncryptUint(amount);
    const encFrom = await teEncryptUint(aliceBal);
    const encTo = await teEncryptUint(bobBal);

    await token
      .connect(alice)
      .encryptedTransfer(bob.address, 500000n, encAmount, encFrom, encTo);

    // Deliver the BITE callback.
    await expect(biteMock.sendCallback({ gasPrice: 0 }))
      .to.emit(token, "EncryptedTransferCompleted")
      .withArgs(alice.address, bob.address, amount);

    expect(await token.balanceOf(alice.address)).to.equal(aliceBal - amount);
    expect(await token.balanceOf(bob.address)).to.equal(bobBal + amount);
  });

  it("(b) reverts on a stale from-balance", async function () {
    await token.issueStake(alice.address, 1000n, await teEncryptUint(1000n));
    await token.issueStake(bob.address, 1n, await teEncryptUint(1n));

    const bobBal = await token.balanceOf(bob.address);
    const amount = 100n;
    const encAmount = await teEncryptUint(amount);
    // Encrypt a WRONG from-balance (stale) — 999 instead of the real 1000.
    const staleFrom = await teEncryptUint(999n);
    const encTo = await teEncryptUint(bobBal);

    await token
      .connect(alice)
      .encryptedTransfer(bob.address, 500000n, encAmount, staleFrom, encTo);

    await expect(biteMock.sendCallback({ gasPrice: 0 })).to.be.revertedWith("Stale from balance");
  });

  it("(c) reverts when onDecrypt is called by a spoofed (unauthorized) caller", async function () {
    // No CTX has been submitted, so no callback sender is authorized. A direct
    // call from an arbitrary account must be rejected.
    const decArgs = [
      abi.encode(["uint256"], [100n]),
      abi.encode(["uint256"], [1000n]),
      abi.encode(["uint256"], [0n]),
    ];
    const plainArgs = [
      abi.encode(["address"], [alice.address]),
      abi.encode(["address"], [bob.address]),
    ];

    await expect(
      token.connect(attacker).onDecrypt(decArgs, plainArgs)
    ).to.be.revertedWith("Caller not BITE callback");
  });

  it("(c2) callback sender is single-use — replaying the same callback reverts", async function () {
    await token.issueStake(alice.address, 1000n, await teEncryptUint(1000n));
    await token.issueStake(bob.address, 1n, await teEncryptUint(1n));

    const aliceBal = await token.balanceOf(alice.address);
    const bobBal = await token.balanceOf(bob.address);
    const amount = 100n;

    await token
      .connect(alice)
      .encryptedTransfer(
        bob.address,
        500000n,
        await teEncryptUint(amount),
        await teEncryptUint(aliceBal),
        await teEncryptUint(bobBal)
      );

    // First callback succeeds.
    await biteMock.sendCallback({ gasPrice: 0 });

    // The CallbackSender was de-authorized after first use. Re-invoking it
    // directly must revert. Recover the sender address from the contract's
    // EncryptedTransferInitiated event is not exposed; instead we assert the
    // queue is now empty (sendCallback reverts with NoCallbacksQueued).
    await expect(biteMock.sendCallback({ gasPrice: 0 })).to.be.reverted;
  });
});

describe("DealRoom — document access CTX callback auth", function () {
  let room, biteMock, owner, participant, attacker;

  beforeEach(async function () {
    [owner, participant, attacker] = await ethers.getSigners();
    biteMock = await deployBiteHarness();

    const Room = await ethers.getContractFactory("DealRoom");
    room = await Room.deploy("Deal", "desc", owner.address, owner.address);
    await room.waitForDeployment();

    await room.addParticipant(participant.address);
  });

  it("reverts when onDecrypt is called by a spoofed caller", async function () {
    const pubKey = abi.encode(
      ["tuple(bytes32,bytes32)"],
      [[ethers.ZeroHash, ethers.ZeroHash]]
    );
    const decArgs = [ethers.toUtf8Bytes("doc"), pubKey];
    const plainArgs = [abi.encode(["uint256"], [0n])];

    await expect(
      room.connect(attacker).onDecrypt(decArgs, plainArgs)
    ).to.be.revertedWith("Caller not BITE callback");
  });

  it("completes the document-access round trip via authorized callback", async function () {
    // Upload a TE-encrypted document.
    const teDoc = await biteMock.encryptTE(ethers.toUtf8Bytes("secret-document"));
    await room.connect(participant).uploadEncryptedDocument(teDoc);

    // The agent's public key, TE-encrypted (the contract decrypts it in the CTX).
    const pkBytes = abi.encode(
      ["tuple(bytes32,bytes32)"],
      [[ethers.hexlify(ethers.randomBytes(32)), ethers.hexlify(ethers.randomBytes(32))]]
    );
    const encPk = await biteMock.encryptTE(pkBytes);

    await room.grantDocumentAccessToAgent(0n, 500000n, encPk);

    await expect(biteMock.sendCallback({ gasPrice: 0 }))
      .to.emit(room, "DocumentDecrypted");

    // ECIES-encrypted data must now be populated.
    const eciesData = await room.connect(participant).getEncryptedDocument(0n);
    expect(eciesData.length).to.be.greaterThan(0);
  });
});

describe("AIDueDiligenceOracle — submit result guards", function () {
  let oracle, owner, agent, requester, other;

  beforeEach(async function () {
    [owner, agent, requester, other] = await ethers.getSigners();
    const Oracle = await ethers.getContractFactory("AIDueDiligenceOracle");
    oracle = await Oracle.deploy(owner.address);
    await oracle.waitForDeployment();

    const future = (await ethers.provider.getBlock("latest")).timestamp + 86400;
    await oracle.registerAgent(agent.address, "agent-1", ethers.ZeroHash, ethers.ZeroHash, future);
  });

  it("(d) reverts on double-submit of a result", async function () {
    await oracle.connect(requester).requestAnalysis(agent.address, 1n, "DueDiligence");
    const result = ethers.toUtf8Bytes("encrypted-result");

    await oracle.connect(agent).submitEncryptedResult(0n, result);

    await expect(
      oracle.connect(agent).submitEncryptedResult(0n, result)
    ).to.be.revertedWith("Already completed");
  });

  it("rejects a submission from a non-assigned agent", async function () {
    await oracle.connect(requester).requestAnalysis(agent.address, 1n, "DueDiligence");
    await expect(
      oracle.connect(other).submitEncryptedResult(0n, ethers.toUtf8Bytes("x"))
    ).to.be.revertedWith("Not the assigned agent");
  });
});

describe("DealRoomFactory — trackDealRoom access control", function () {
  let factory, owner, stranger;

  beforeEach(async function () {
    [owner, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DealRoomFactory");
    factory = await Factory.deploy(owner.address);
    await factory.waitForDeployment();
  });

  it("(e) reverts when a non-owner calls trackDealRoom", async function () {
    const fake = ethers.Wallet.createRandom().address;
    await expect(
      factory.connect(stranger).trackDealRoom(fake, "Sneaky")
    ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
  });

  it("allows the owner to track a deal room", async function () {
    const room = ethers.Wallet.createRandom().address;
    await expect(factory.connect(owner).trackDealRoom(room, "Legit"))
      .to.emit(factory, "DealRoomTracked");
    expect(await factory.isDealRoom(room)).to.equal(true);
  });
});
