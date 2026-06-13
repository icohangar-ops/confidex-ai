// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IBiteSupplicant } from "@skalenetwork/bite-solidity/interfaces/IBiteSupplicant.sol";
import { BITE } from "@skalenetwork/bite-solidity/BITE.sol";
import { PublicKey } from "@skalenetwork/bite-solidity/types.sol";

/**
 * @title DealStakeToken
 * @notice Confidential ERC-20 token for deal stakes with TE/ECIES dual-encrypted balances.
 *         Balances are stored threshold-encrypted. Transfers are performed via BITE
 *         CTX callbacks that decrypt, validate, update balances, and re-encrypt.
 */
contract DealStakeToken is ERC20, Ownable, IBiteSupplicant {
    // ──────────────────── State ────────────────────
    uint8 private _decimals;

    // holder address => TE-encrypted balance
    mapping(address => bytes) private _thresholdBalances;

    // holder address => ECIES-encrypted balance
    mapping(address => bytes) private _eciesBalances;

    // holder address => whether they have a registered viewer key
    mapping(address => bool) private _hasViewerKey;

    // holder address => registered ECIES public key
    mapping(address => PublicKey) private _viewerKeys;

    // pending transfer info (set during CTX callback)
    struct PendingTransfer {
        address from;
        address to;
        uint256 amount;
    }

    // CallbackSender addresses authorized to invoke onDecrypt(). BITE.submitCTX()
    // returns a unique, single-use callback-sender contract per CTX; only that
    // address may deliver the matching decryption callback. Without this the
    // entire threshold-encryption guarantee is bypassable (anyone could call
    // onDecrypt() with crafted decryptedArguments and move stake tokens).
    mapping(address => bool) private _pendingCallbackSenders;

    // ──────────────────── Events ────────────────────
    event StakeIssued(address indexed recipient, uint256 amount);
    event BatchStakeIssued(address[] recipients, uint256[] amounts);
    event EncryptedTransferInitiated(address indexed from, address indexed to);
    event EncryptedTransferCompleted(address indexed from, address indexed to, uint256 amount);
    event ViewerKeyRegistered(address indexed holder);

    // ──────────────────── Constructor ────────────────────
    constructor(
        string memory name_,
        string memory symbol_,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        _decimals = 18;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    // ──────────────────── Stake Issuance ────────────────────

    /// @notice Issue stake tokens to a recipient (only owner)
    /// @param recipient Address to receive tokens
    /// @param amount Amount of tokens to mint
    /// @param teEncryptedBalance TE-encrypted balance of the recipient after issuance
    function issueStake(
        address recipient,
        uint256 amount,
        bytes calldata teEncryptedBalance
    ) external onlyOwner {
        require(recipient != address(0), "Zero address");
        require(amount > 0, "Zero amount");

        _mint(recipient, amount);

        // Store TE-encrypted balance
        _thresholdBalances[recipient] = teEncryptedBalance;

        // Clear ECIES balance (stale after issuance)
        delete _eciesBalances[recipient];

        emit StakeIssued(recipient, amount);
    }

    /// @notice Batch issue stake tokens (only owner)
    /// @param recipients Addresses to receive tokens
    /// @param amounts Amounts of tokens to mint
    /// @param teEncryptedBalances TE-encrypted balances after issuance
    function batchIssueStake(
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes[] calldata teEncryptedBalances
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length == teEncryptedBalances.length, "Length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Zero address");
            require(amounts[i] > 0, "Zero amount");

            _mint(recipients[i], amounts[i]);
            _thresholdBalances[recipients[i]] = teEncryptedBalances[i];
            delete _eciesBalances[recipients[i]];
        }

        emit BatchStakeIssued(recipients, amounts);
    }

    // ──────────────────── Encrypted Transfer ────────────────────

    /// @notice Initiate an encrypted transfer via CTX
    /// @param to Recipient address
    /// @param gasLimit Gas limit for the callback
    /// @param encryptedAmount TE-encrypted transfer amount
    /// @param encryptedFromBalance TE-encrypted sender balance
    /// @param encryptedToBalance TE-encrypted recipient balance
    function encryptedTransfer(
        address to,
        uint256 gasLimit,
        bytes calldata encryptedAmount,
        bytes calldata encryptedFromBalance,
        bytes calldata encryptedToBalance
    ) external {
        require(to != address(0), "Zero address");
        require(msg.sender != to, "Self transfer");

        bytes[] memory encryptedArgs = new bytes[](3);
        encryptedArgs[0] = encryptedAmount;
        encryptedArgs[1] = encryptedFromBalance;
        encryptedArgs[2] = encryptedToBalance;

        bytes[] memory plaintextArgs = new bytes[](2);
        plaintextArgs[0] = abi.encode(msg.sender);
        plaintextArgs[1] = abi.encode(to);

        address callbackSender = BITE.submitCTX(
            BITE.SUBMIT_CTX_ADDRESS,
            gasLimit,
            encryptedArgs,
            plaintextArgs
        );

        // Authorize the unique callback sender returned for this CTX so that
        // only it can deliver the matching onDecrypt() callback.
        _pendingCallbackSenders[callbackSender] = true;

        emit EncryptedTransferInitiated(msg.sender, to);
    }

    /// @notice BITE callback: performs balance checks and transfer, re-encrypts new balances
    /// @param decryptedArguments [amount, fromBalance, toBalance]
    /// @param plaintextArguments [fromAddress, toAddress]
    function onDecrypt(
        bytes[] calldata decryptedArguments,
        bytes[] calldata plaintextArguments
    ) external override {
        // Caller-identity guard: only a callback sender registered by a prior
        // encryptedTransfer() CTX submission may invoke this. This prevents an
        // arbitrary EOA/contract from spoofing onDecrypt() with crafted
        // arguments and moving stake tokens. The sender is single-use.
        require(_pendingCallbackSenders[msg.sender], "Caller not BITE callback");
        delete _pendingCallbackSenders[msg.sender];

        require(decryptedArguments.length >= 3, "Invalid decrypted args");
        require(plaintextArguments.length >= 2, "Invalid plaintext args");

        uint256 amount = abi.decode(decryptedArguments[0], (uint256));
        uint256 fromBalance = abi.decode(decryptedArguments[1], (uint256));
        uint256 toBalance = abi.decode(decryptedArguments[2], (uint256));

        address from = abi.decode(plaintextArguments[0], (address));
        address to = abi.decode(plaintextArguments[1], (address));

        // Validate balances (stale detection)
        require(balanceOf(from) == fromBalance, "Stale from balance");
        require(balanceOf(to) == toBalance, "Stale to balance");
        require(fromBalance >= amount, "Insufficient balance");
        require(amount > 0, "Zero amount");

        // Perform the transfer
        _transfer(from, to, amount);

        // Re-encrypt new balances with TE
        uint256 newFromBalance = balanceOf(from);
        uint256 newToBalance = balanceOf(to);

        _thresholdBalances[from] = BITE.encryptTE(
            BITE.ENCRYPT_TE_ADDRESS,
            abi.encode(newFromBalance)
        );
        _thresholdBalances[to] = BITE.encryptTE(
            BITE.ENCRYPT_TE_ADDRESS,
            abi.encode(newToBalance)
        );

        // Clear stale ECIES balances
        delete _eciesBalances[from];
        delete _eciesBalances[to];

        emit EncryptedTransferCompleted(from, to, amount);
    }

    // ──────────────────── Viewer Key Management ────────────────────

    /// @notice Register an ECIES public key for viewing encrypted balances
    /// @param x The x-coordinate of the ECIES public key
    /// @param y The y-coordinate of the ECIES public key
    function registerViewerKey(bytes32 x, bytes32 y) external {
        _viewerKeys[msg.sender] = PublicKey({ x: x, y: y });
        _hasViewerKey[msg.sender] = true;

        emit ViewerKeyRegistered(msg.sender);
    }

    /// @notice Get ECIES-encrypted balance for a caller
    /// @param account Address to query
    /// @return ECIES-encrypted balance data
    function encryptedBalanceOf(address account) external view returns (bytes memory) {
        return _eciesBalances[account];
    }

    /// @notice Get TE-encrypted balance for an account
    /// @param account Address to query
    /// @return TE-encrypted balance data
    function thresholdBalanceOf(address account) external view returns (bytes memory) {
        return _thresholdBalances[account];
    }

    /// @notice Check if an account has a registered viewer key
    function hasViewerKey(address account) external view returns (bool) {
        return _hasViewerKey[account];
    }
}
