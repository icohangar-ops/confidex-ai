const { expect } = require("chai");
const { ethers } = require("hardhat");

// BITE precompile addresses (see node_modules/@skalenetwork/bite-solidity/BITE.sol)
const SUBMIT_CTX_ADDRESS = "0x000000000000000000000000000000000000001B";
const ENCRYPT_ECIES_ADDRESS = "0x000000000000000000000000000000000000001C";
const ENCRYPT_TE_ADDRESS = "0x000000000000000000000000000000000000001D";

const abi = ethers.AbiCoder.defaultAbiCoder();

// Install the BITE precompile mocks at their canonical addresses. Mirrors the
// harness in bite.test.js; duplicated here so this money/math suite is
// self-contained.
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

/**
 * Money/math characterization suite for DealStakeToken.
 *
 * The "money" is the on-chain ERC-20 stake ledger (balanceOf / totalSupply).
 * Encrypted balances are opaque blobs; the authoritative settlement math lives
 * in `_mint` (issuance) and `onDecrypt -> _transfer` (settlement). These tests
 * compute every expected amount by hand from the formula and assert the ledger
 * matches, so any regression in the debit/credit/conservation logic fails.
 */
describe("DealStakeToken — staking/settlement math", function () {
  let token, biteMock, owner, alice, bob, carol;

  beforeEach(async function () {
    [owner, alice, bob, carol] = await ethers.getSigners();
    biteMock = await deployBiteHarness();

    const Token = await ethers.getContractFactory("DealStakeToken");
    token = await Token.deploy("Stake", "STK", owner.address);
    await token.waitForDeployment();
  });

  async function teEncryptUint(value) {
    return await biteMock.encryptTE(abi.encode(["uint256"], [value]));
  }

  // Submit a CTX transfer and deliver its callback. Returns the tx of the
  // delivered callback so callers can assert events/reverts on settlement.
  async function settleTransfer(signer, to, amount, fromBalEnc, toBalEnc) {
    await token
      .connect(signer)
      .encryptedTransfer(
        to,
        500000n,
        await teEncryptUint(amount),
        fromBalEnc,
        toBalEnc
      );
    return biteMock.sendCallback({ gasPrice: 0 });
  }

  // ──────────────── Issuance math ────────────────

  describe("issueStake", function () {
    it("mints exactly the requested amount and tracks totalSupply", async function () {
      expect(await token.totalSupply()).to.equal(0n);

      await token.issueStake(alice.address, 1000n, await teEncryptUint(1000n));
      expect(await token.balanceOf(alice.address)).to.equal(1000n);
      expect(await token.totalSupply()).to.equal(1000n);

      // A second issuance to a DIFFERENT holder accumulates supply but does not
      // touch the first holder's ledger balance.
      await token.issueStake(bob.address, 250n, await teEncryptUint(250n));
      expect(await token.balanceOf(bob.address)).to.equal(250n);
      expect(await token.balanceOf(alice.address)).to.equal(1000n);
      expect(await token.totalSupply()).to.equal(1250n);
    });

    it("issuing twice to the same holder mints additively (mint, not set)", async function () {
      // The encrypted balance arg is just a stored blob; the LEDGER must be the
      // running sum of mints. 400 + 600 = 1000.
      await token.issueStake(alice.address, 400n, await teEncryptUint(400n));
      await token.issueStake(alice.address, 600n, await teEncryptUint(1000n));
      expect(await token.balanceOf(alice.address)).to.equal(1000n);
      expect(await token.totalSupply()).to.equal(1000n);
    });

    it("rejects zero amount (no dust/no-op mints)", async function () {
      await expect(
        token.issueStake(alice.address, 0n, await teEncryptUint(0n))
      ).to.be.revertedWith("Zero amount");
      expect(await token.totalSupply()).to.equal(0n);
    });

    it("rejects minting to the zero address", async function () {
      await expect(
        token.issueStake(ethers.ZeroAddress, 100n, await teEncryptUint(100n))
      ).to.be.revertedWith("Zero address");
    });

    it("mints a max-uint256 amount without overflow", async function () {
      const MAX = (1n << 256n) - 1n;
      await token.issueStake(alice.address, MAX, await teEncryptUint(MAX));
      expect(await token.balanceOf(alice.address)).to.equal(MAX);
      expect(await token.totalSupply()).to.equal(MAX);
    });

    it("a second mint that would overflow totalSupply reverts (no wraparound)", async function () {
      const MAX = (1n << 256n) - 1n;
      await token.issueStake(alice.address, MAX, await teEncryptUint(MAX));
      // Any further mint pushes totalSupply past 2^256-1 -> OZ ERC20 overflow guard.
      await expect(
        token.issueStake(bob.address, 1n, await teEncryptUint(1n))
      ).to.be.reverted;
      expect(await token.totalSupply()).to.equal(MAX);
    });
  });

  describe("batchIssueStake", function () {
    it("mints each recipient's exact amount and sums totalSupply", async function () {
      const recipients = [alice.address, bob.address, carol.address];
      const amounts = [100n, 200n, 700n];
      const encs = await Promise.all(amounts.map((a) => teEncryptUint(a)));

      await token.batchIssueStake(recipients, amounts, encs);

      expect(await token.balanceOf(alice.address)).to.equal(100n);
      expect(await token.balanceOf(bob.address)).to.equal(200n);
      expect(await token.balanceOf(carol.address)).to.equal(700n);
      // Expected total computed by hand: 100 + 200 + 700 = 1000.
      expect(await token.totalSupply()).to.equal(1000n);
    });

    it("reverts on length mismatch and mints nothing (atomic)", async function () {
      await expect(
        token.batchIssueStake(
          [alice.address, bob.address],
          [100n],
          [await teEncryptUint(100n)]
        )
      ).to.be.revertedWith("Length mismatch");
      expect(await token.totalSupply()).to.equal(0n);
    });

    it("reverts the whole batch if any amount is zero (no partial issuance)", async function () {
      const recipients = [alice.address, bob.address];
      const amounts = [100n, 0n];
      const encs = [await teEncryptUint(100n), await teEncryptUint(0n)];
      await expect(
        token.batchIssueStake(recipients, amounts, encs)
      ).to.be.revertedWith("Zero amount");
      // Alice's mint in the same batch must be rolled back.
      expect(await token.balanceOf(alice.address)).to.equal(0n);
      expect(await token.totalSupply()).to.equal(0n);
    });
  });

  // ──────────────── Settlement math (onDecrypt -> _transfer) ────────────────

  describe("encrypted transfer settlement", function () {
    it("debits sender and credits recipient by the EXACT amount; supply invariant", async function () {
      await token.issueStake(alice.address, 1000n, await teEncryptUint(1000n));
      await token.issueStake(bob.address, 200n, await teEncryptUint(200n));

      const aliceBal = await token.balanceOf(alice.address); // 1000
      const bobBal = await token.balanceOf(bob.address); // 200
      const supplyBefore = await token.totalSupply(); // 1200
      const amount = 250n;

      await expect(
        settleTransfer(
          alice,
          bob.address,
          amount,
          await teEncryptUint(aliceBal),
          await teEncryptUint(bobBal)
        )
      )
        .to.emit(token, "EncryptedTransferCompleted")
        .withArgs(alice.address, bob.address, amount);

      // Hand-computed: alice 1000-250=750, bob 200+250=450.
      expect(await token.balanceOf(alice.address)).to.equal(750n);
      expect(await token.balanceOf(bob.address)).to.equal(450n);
      // Conservation: sender debit == recipient credit, supply unchanged.
      expect(await token.balanceOf(alice.address) + (await token.balanceOf(bob.address)))
        .to.equal(aliceBal + bobBal);
      expect(await token.totalSupply()).to.equal(supplyBefore);
    });

    it("allows draining the EXACT full balance (fromBalance == amount boundary)", async function () {
      await token.issueStake(alice.address, 500n, await teEncryptUint(500n));
      await token.issueStake(bob.address, 1n, await teEncryptUint(1n));

      const aliceBal = await token.balanceOf(alice.address); // 500
      const bobBal = await token.balanceOf(bob.address); // 1

      await settleTransfer(
        alice,
        bob.address,
        aliceBal, // amount == full balance
        await teEncryptUint(aliceBal),
        await teEncryptUint(bobBal)
      );

      expect(await token.balanceOf(alice.address)).to.equal(0n);
      expect(await token.balanceOf(bob.address)).to.equal(bobBal + aliceBal); // 501
    });

    it("reverts an overdraft by exactly 1 wei (amount = fromBalance + 1)", async function () {
      await token.issueStake(alice.address, 500n, await teEncryptUint(500n));
      await token.issueStake(bob.address, 1n, await teEncryptUint(1n));

      const aliceBal = await token.balanceOf(alice.address); // 500
      const bobBal = await token.balanceOf(bob.address); // 1

      await expect(
        settleTransfer(
          alice,
          bob.address,
          aliceBal + 1n, // one wei more than held -> must fail "Insufficient balance"
          await teEncryptUint(aliceBal),
          await teEncryptUint(bobBal)
        )
      ).to.be.revertedWith("Insufficient balance");

      // Ledger untouched by the failed settlement.
      expect(await token.balanceOf(alice.address)).to.equal(aliceBal);
      expect(await token.balanceOf(bob.address)).to.equal(bobBal);
    });

    it("reverts a zero-amount settlement (no economically meaningless transfers)", async function () {
      await token.issueStake(alice.address, 100n, await teEncryptUint(100n));
      await token.issueStake(bob.address, 1n, await teEncryptUint(1n));

      await expect(
        settleTransfer(
          alice,
          bob.address,
          0n,
          await teEncryptUint(await token.balanceOf(alice.address)),
          await teEncryptUint(await token.balanceOf(bob.address))
        )
      ).to.be.revertedWith("Zero amount");
    });

    it("reverts on a stale TO balance (recipient balance changed since CTX submit)", async function () {
      await token.issueStake(alice.address, 1000n, await teEncryptUint(1000n));
      await token.issueStake(bob.address, 200n, await teEncryptUint(200n));

      const aliceBal = await token.balanceOf(alice.address);
      // Claim bob holds 999 when he actually holds 200 -> stale, must revert.
      await expect(
        settleTransfer(
          alice,
          bob.address,
          50n,
          await teEncryptUint(aliceBal),
          await teEncryptUint(999n)
        )
      ).to.be.revertedWith("Stale to balance");
    });

    it("is NOT replayable: a settled CTX cannot be re-delivered to double-spend", async function () {
      await token.issueStake(alice.address, 1000n, await teEncryptUint(1000n));
      await token.issueStake(bob.address, 1n, await teEncryptUint(1n));

      const aliceBal = await token.balanceOf(alice.address);
      const bobBal = await token.balanceOf(bob.address);
      const amount = 300n;

      await settleTransfer(
        alice,
        bob.address,
        amount,
        await teEncryptUint(aliceBal),
        await teEncryptUint(bobBal)
      );
      // First settlement moved exactly `amount`.
      expect(await token.balanceOf(alice.address)).to.equal(aliceBal - amount);
      expect(await token.balanceOf(bob.address)).to.equal(bobBal + amount);

      // Re-delivering the same (now de-authorized, single-use) callback must not
      // move money a second time. The mock queue is empty -> revert.
      await expect(biteMock.sendCallback({ gasPrice: 0 })).to.be.reverted;

      // Ledger unchanged after the failed replay.
      expect(await token.balanceOf(alice.address)).to.equal(aliceBal - amount);
      expect(await token.balanceOf(bob.address)).to.equal(bobBal + amount);
    });

    it("conserves total value across a chain of three settlements", async function () {
      await token.issueStake(alice.address, 1000n, await teEncryptUint(1000n));
      await token.issueStake(bob.address, 500n, await teEncryptUint(500n));
      const supply = await token.totalSupply(); // 1500

      // alice -> bob 100
      await settleTransfer(
        alice,
        bob.address,
        100n,
        await teEncryptUint(await token.balanceOf(alice.address)),
        await teEncryptUint(await token.balanceOf(bob.address))
      );
      // bob -> carol 400  (carol starts at 0; onDecrypt validates toBalance==0)
      await settleTransfer(
        bob,
        carol.address,
        400n,
        await teEncryptUint(await token.balanceOf(bob.address)),
        await teEncryptUint(await token.balanceOf(carol.address))
      );
      // alice -> carol 50
      await settleTransfer(
        alice,
        carol.address,
        50n,
        await teEncryptUint(await token.balanceOf(alice.address)),
        await teEncryptUint(await token.balanceOf(carol.address))
      );

      // Hand-computed end state:
      // alice: 1000 -100 -50 = 850
      // bob:   500  +100 -400 = 200
      // carol: 0    +400 +50  = 450
      expect(await token.balanceOf(alice.address)).to.equal(850n);
      expect(await token.balanceOf(bob.address)).to.equal(200n);
      expect(await token.balanceOf(carol.address)).to.equal(450n);
      // Sum is conserved and equals the original minted supply.
      expect(
        (await token.balanceOf(alice.address)) +
          (await token.balanceOf(bob.address)) +
          (await token.balanceOf(carol.address))
      ).to.equal(supply);
      expect(await token.totalSupply()).to.equal(supply);
    });
  });
});
