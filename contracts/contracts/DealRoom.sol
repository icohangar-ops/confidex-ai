// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { IBiteSupplicant } from "@skalenetwork/bite-solidity/interfaces/IBiteSupplicant.sol";
import { BITE } from "@skalenetwork/bite-solidity/BITE.sol";
import { PublicKey } from "@skalenetwork/bite-solidity/types.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DealRoom
 * @notice Confidential M&A deal room powered by SKALE BITE threshold encryption.
 *         Documents are stored TE-encrypted on-chain. Access is granted via
 *         CTX decryption + ECIES re-encryption callbacks.
 */
contract DealRoom is Ownable, IBiteSupplicant {
    // ──────────────────── Enums ────────────────────
    enum DealState {
        Created,
        DueDiligence,
        Negotiation,
        PendingClose,
        Closed,
        Terminated
    }

    // ──────────────────── Structs ────────────────────
    struct DealInfo {
        string name;
        string description;
        DealState state;
        uint256 createdAt;
        address factory;
    }

    struct EncryptedDocument {
        bytes teEncryptedData;      // threshold-encrypted document (stored on-chain)
        bytes eciesEncryptedData;    // ECIES-encrypted for a specific viewer
        uint256 uploadedAt;
        address uploader;
    }

    struct Participant {
        bool isParticipant;
        address viewerKeyAddress;    // address whose ECIES key is registered
        PublicKey viewerKey;
        bool hasViewerKey;
    }

    // ──────────────────── State ────────────────────
    DealInfo public dealInfo;

    // documentId => EncryptedDocument
    mapping(uint256 => EncryptedDocument) private _documents;
    uint256 private _documentCount;

    // documentId => viewer address => ECIES-encrypted data
    mapping(uint256 => mapping(address => bytes)) private _viewerEncryptedData;

    // participant address => Participant
    mapping(address => Participant) private _participants;

    // address => isRegistered AI agent
    mapping(address => bool) private _aiAgents;

    // CallbackSender addresses authorized to invoke onDecrypt(). BITE.submitCTX()
    // returns a unique, single-use callback-sender contract per CTX; only that
    // address may deliver the matching decryption callback. Without this guard
    // anyone could call onDecrypt() with crafted decryptedArguments and corrupt
    // re-encrypted document data, bypassing threshold encryption entirely.
    mapping(address => bool) private _pendingCallbackSenders;

    // ──────────────────── Events ────────────────────
    event DocumentUploaded(uint256 indexed documentId, address indexed uploader, uint256 timestamp);
    event DocumentAccessGranted(uint256 indexed documentId, address indexed agent);
    event DocumentDecrypted(uint256 indexed documentId, address indexed viewer);
    event ParticipantAdded(address indexed participant);
    event ParticipantRemoved(address indexed participant);
    event ViewerKeyRegistered(address indexed participant);
    event AgentAdded(address indexed agent);
    event AgentRemoved(address indexed agent);
    event StateChanged(DealState indexed newState);

    // ──────────────────── Constructor ────────────────────
    constructor(
        string memory name_,
        string memory description_,
        address factory_,
        address owner_
    ) Ownable(owner_) {
        dealInfo = DealInfo({
            name: name_,
            description: description_,
            state: DealState.Created,
            createdAt: block.timestamp,
            factory: factory_
        });
    }

    // ──────────────────── Document Management ────────────────────

    /// @notice Upload a TE-encrypted document to the deal room
    /// @param teEncryptedData The threshold-encrypted document data
    function uploadEncryptedDocument(bytes calldata teEncryptedData) external onlyParticipant {
        require(teEncryptedData.length > 0, "Empty document");

        uint256 docId = _documentCount;
        _documents[docId] = EncryptedDocument({
            teEncryptedData: teEncryptedData,
            eciesEncryptedData: bytes(""),
            uploadedAt: block.timestamp,
            uploader: msg.sender
        });

        _documentCount++;

        emit DocumentUploaded(docId, msg.sender, block.timestamp);
    }

    /// @notice Grant an AI agent access to a document by submitting a CTX
    ///         The CTX will decrypt the TE data and re-encrypt it via ECIES for the agent
    /// @param documentId The document to grant access to
    /// @param gasLimit Gas limit for the decryption callback
    /// @param encryptedPublicKey TE-encrypted public key of the agent (for ECIES re-encryption)
    function grantDocumentAccessToAgent(
        uint256 documentId,
        uint256 gasLimit,
        bytes calldata encryptedPublicKey
    ) external onlyOwner {
        require(documentId < _documentCount, "Invalid document ID");
        require(_documents[documentId].teEncryptedData.length > 0, "Document not found");

        bytes[] memory encryptedArgs = new bytes[](2);
        encryptedArgs[0] = _documents[documentId].teEncryptedData;
        encryptedArgs[1] = encryptedPublicKey;

        bytes[] memory plaintextArgs = new bytes[](1);
        plaintextArgs[0] = abi.encode(documentId);

        address callbackSender = BITE.submitCTX(
            BITE.SUBMIT_CTX_ADDRESS,
            gasLimit,
            encryptedArgs,
            plaintextArgs
        );

        // Authorize the unique callback sender returned for this CTX so that
        // only it can deliver the matching onDecrypt() callback.
        _pendingCallbackSenders[callbackSender] = true;

        emit DocumentAccessGranted(documentId, msg.sender);
    }

    /// @notice BITE callback: receives decrypted data and re-encrypts for viewers
    /// @param decryptedArguments [decryptedDocument, decryptedPublicKey]
    /// @param plaintextArguments [documentId]
    function onDecrypt(
        bytes[] calldata decryptedArguments,
        bytes[] calldata plaintextArguments
    ) external override {
        // Caller-identity guard: only a callback sender registered by a prior
        // grantDocumentAccessToAgent() CTX submission may invoke this. Prevents
        // an arbitrary EOA/contract from spoofing onDecrypt() with crafted
        // arguments and overwriting re-encrypted document data. Single-use.
        require(_pendingCallbackSenders[msg.sender], "Caller not BITE callback");
        delete _pendingCallbackSenders[msg.sender];

        require(decryptedArguments.length >= 2, "Invalid decrypted args");
        require(plaintextArguments.length >= 1, "Invalid plaintext args");

        bytes memory decryptedDocument = decryptedArguments[0];
        PublicKey memory publicKey = abi.decode(decryptedArguments[1], (PublicKey));
        uint256 documentId = abi.decode(plaintextArguments[0], (uint256));

        require(documentId < _documentCount, "Invalid document ID in callback");

        // Re-encrypt for the agent using ECIES
        bytes memory eciesEncrypted = BITE.encryptECIES(
            BITE.ENCRYPT_ECIES_ADDRESS,
            decryptedDocument,
            publicKey
        );

        _documents[documentId].eciesEncryptedData = eciesEncrypted;

        emit DocumentDecrypted(documentId, msg.sender);
    }

    /// @notice Get ECIES-encrypted document data for the caller
    /// @param documentId The document to retrieve
    /// @return The ECIES-encrypted data
    function getEncryptedDocument(uint256 documentId) external view onlyParticipant returns (bytes memory) {
        require(documentId < _documentCount, "Invalid document ID");
        return _documents[documentId].eciesEncryptedData;
    }

    /// @notice Get TE-encrypted document data (owner only)
    /// @param documentId The document to retrieve
    /// @return The TE-encrypted data
    function getTeEncryptedDocument(uint256 documentId) external view onlyOwner returns (bytes memory) {
        require(documentId < _documentCount, "Invalid document ID");
        return _documents[documentId].teEncryptedData;
    }

    /// @notice Get total number of documents
    function documentCount() external view returns (uint256) {
        return _documentCount;
    }

    // ──────────────────── Participant Management ────────────────────

    /// @notice Add a participant to the deal room
    /// @param participant The address to add
    function addParticipant(address participant) external onlyOwner {
        require(participant != address(0), "Zero address");
        require(!_participants[participant].isParticipant, "Already a participant");

        _participants[participant] = Participant({
            isParticipant: true,
            viewerKeyAddress: address(0),
            viewerKey: PublicKey({ x: bytes32(0), y: bytes32(0) }),
            hasViewerKey: false
        });

        emit ParticipantAdded(participant);
    }

    /// @notice Remove a participant from the deal room
    /// @param participant The address to remove
    function removeParticipant(address participant) external onlyOwner {
        require(_participants[participant].isParticipant, "Not a participant");

        delete _participants[participant];

        emit ParticipantRemoved(participant);
    }

    /// @notice Register an ECIES viewer public key for a participant
    /// @param x The x-coordinate of the public key
    /// @param y The y-coordinate of the public key
    function registerViewerKey(bytes32 x, bytes32 y) external onlyParticipant {
        _participants[msg.sender].viewerKey = PublicKey({ x: x, y: y });
        _participants[msg.sender].hasViewerKey = true;
        _participants[msg.sender].viewerKeyAddress = msg.sender;

        emit ViewerKeyRegistered(msg.sender);
    }

    /// @notice Check if an address is a participant
    function isParticipant(address addr) external view returns (bool) {
        return _participants[addr].isParticipant;
    }

    // ──────────────────── AI Agent Management ────────────────────

    /// @notice Register an AI agent in this deal room
    /// @param agent The address of the AI agent
    function addAgent(address agent) external onlyOwner {
        require(agent != address(0), "Zero address");
        require(!_aiAgents[agent], "Already an agent");

        _aiAgents[agent] = true;
        emit AgentAdded(agent);
    }

    /// @notice Remove an AI agent from this deal room
    /// @param agent The address of the AI agent
    function removeAgent(address agent) external onlyOwner {
        require(_aiAgents[agent], "Not an agent");

        delete _aiAgents[agent];
        emit AgentRemoved(agent);
    }

    /// @notice Check if an address is a registered AI agent
    function isAgent(address addr) external view returns (bool) {
        return _aiAgents[addr];
    }

    // ──────────────────── Deal State Management ────────────────────

    /// @notice Advance the deal to the next state
    function advanceState() external onlyOwner {
        require(uint8(dealInfo.state) < 5, "Already terminal");

        dealInfo.state = DealState(uint8(dealInfo.state) + 1);

        emit StateChanged(dealInfo.state);
    }

    /// @notice Terminate the deal
    function terminateDeal() external onlyOwner {
        dealInfo.state = DealState.Terminated;
        emit StateChanged(DealState.Terminated);
    }

    // ──────────────────── Modifiers ────────────────────

    modifier onlyParticipant() {
        require(_participants[msg.sender].isParticipant, "Not a participant");
        _;
    }
}
