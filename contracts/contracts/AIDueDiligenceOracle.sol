// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { BITE } from "@skalenetwork/bite-solidity/BITE.sol";
import { PublicKey } from "@skalenetwork/bite-solidity/types.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIDueDiligenceOracle
 * @notice AI agent registry for confidential due diligence analysis.
 *         AI agents are registered with time-bound authorization and can
 *         submit TE-encrypted analysis results for on-chain record.
 */
contract AIDueDiligenceOracle is Ownable {
    // ──────────────────── Structs ────────────────────
    struct AIAgent {
        address agentAddress;
        string name;
        PublicKey viewerKey;
        bool isRegistered;
        uint256 registeredAt;
        uint256 authorizedUntil;
        uint256 analysesCompleted;
    }

    struct AnalysisRequest {
        uint256 requestId;
        address requester;
        address agent;
        uint256 documentId;
        string analysisType;
        uint256 requestedAt;
        bool isCompleted;
        uint256 completedAt;
        bytes teEncryptedResult;
    }

    // ──────────────────── State ────────────────────
    mapping(address => AIAgent) private _agents;
    address[] private _agentAddresses;

    uint256 private _requestCount;
    mapping(uint256 => AnalysisRequest) private _requests;

    // requester address => their request IDs
    mapping(address => uint256[]) private _requesterRequests;

    // ──────────────────── Events ────────────────────
    event AgentRegistered(address indexed agent, string name, uint256 authorizedUntil);
    event AgentDeactivated(address indexed agent);
    event AgentAuthorizationExtended(address indexed agent, uint256 newAuthorizedUntil);
    event AnalysisRequested(uint256 indexed requestId, address indexed requester, address indexed agent, uint256 documentId);
    event AnalysisResultSubmitted(uint256 indexed requestId, address indexed agent);

    // ──────────────────── Constructor ────────────────────
    constructor(address owner_) Ownable(owner_) {}

    // ──────────────────── Agent Management ────────────────────

    /// @notice Register a new AI agent with time-bound authorization
    /// @param agent The address of the AI agent
    /// @param name The name of the AI agent
    /// @param viewerX The x-coordinate of the agent's ECIES public key
    /// @param viewerY The y-coordinate of the agent's ECIES public key
    /// @param authorizedUntil Timestamp until which the agent is authorized
    function registerAgent(
        address agent,
        string calldata name,
        bytes32 viewerX,
        bytes32 viewerY,
        uint256 authorizedUntil
    ) external onlyOwner {
        require(agent != address(0), "Zero address");
        require(!_agents[agent].isRegistered, "Already registered");
        require(authorizedUntil > block.timestamp, "Authorization must be in the future");

        _agents[agent] = AIAgent({
            agentAddress: agent,
            name: name,
            viewerKey: PublicKey({ x: viewerX, y: viewerY }),
            isRegistered: true,
            registeredAt: block.timestamp,
            authorizedUntil: authorizedUntil,
            analysesCompleted: 0
        });

        _agentAddresses.push(agent);

        emit AgentRegistered(agent, name, authorizedUntil);
    }

    /// @notice Deactivate an AI agent
    /// @param agent The address of the AI agent to deactivate
    function deactivateAgent(address agent) external onlyOwner {
        require(_agents[agent].isRegistered, "Not registered");

        _agents[agent].isRegistered = false;

        emit AgentDeactivated(agent);
    }

    /// @notice Extend an agent's authorization period
    /// @param agent The address of the AI agent
    /// @param newAuthorizedUntil New expiration timestamp
    function extendAgentAuthorization(
        address agent,
        uint256 newAuthorizedUntil
    ) external onlyOwner {
        require(_agents[agent].isRegistered, "Not registered");
        require(newAuthorizedUntil > _agents[agent].authorizedUntil, "Must extend authorization");

        _agents[agent].authorizedUntil = newAuthorizedUntil;

        emit AgentAuthorizationExtended(agent, newAuthorizedUntil);
    }

    // ──────────────────── Analysis ────────────────────

    /// @notice Request an analysis for a document by a specific AI agent
    /// @param agent The AI agent to perform the analysis
    /// @param documentId The document ID to analyze
    /// @param analysisType The type of analysis (e.g., "financial", "legal", "technical")
    function requestAnalysis(
        address agent,
        uint256 documentId,
        string calldata analysisType
    ) external returns (uint256) {
        require(_agents[agent].isRegistered, "Agent not registered");
        require(block.timestamp <= _agents[agent].authorizedUntil, "Agent authorization expired");

        uint256 requestId = _requestCount;

        _requests[requestId] = AnalysisRequest({
            requestId: requestId,
            requester: msg.sender,
            agent: agent,
            documentId: documentId,
            analysisType: analysisType,
            requestedAt: block.timestamp,
            isCompleted: false,
            completedAt: 0,
            teEncryptedResult: bytes("")
        });

        _requesterRequests[msg.sender].push(requestId);
        _requestCount++;

        emit AnalysisRequested(requestId, msg.sender, agent, documentId);

        return requestId;
    }

    /// @notice Submit a TE-encrypted analysis result (only by registered agent)
    /// @param requestId The analysis request ID
    /// @param teEncryptedResult The threshold-encrypted analysis result
    function submitEncryptedResult(
        uint256 requestId,
        bytes calldata teEncryptedResult
    ) external {
        require(requestId < _requestCount, "Invalid request ID");
        require(msg.sender == _requests[requestId].agent, "Not the assigned agent");
        require(!_requests[requestId].isCompleted, "Already completed");
        require(_agents[msg.sender].isRegistered, "Agent not registered");
        require(block.timestamp <= _agents[msg.sender].authorizedUntil, "Authorization expired");
        require(teEncryptedResult.length > 0, "Empty result");

        _requests[requestId].isCompleted = true;
        _requests[requestId].completedAt = block.timestamp;
        _requests[requestId].teEncryptedResult = teEncryptedResult;

        _agents[msg.sender].analysesCompleted++;

        emit AnalysisResultSubmitted(requestId, msg.sender);
    }

    // ──────────────────── View Functions ────────────────────

    /// @notice Get information about an AI agent
    function getAgent(address agent) external view returns (
        address agentAddress,
        string memory name,
        bool isRegistered,
        uint256 registeredAt,
        uint256 authorizedUntil,
        uint256 analysesCompleted
    ) {
        AIAgent storage a = _agents[agent];
        return (
            a.agentAddress,
            a.name,
            a.isRegistered,
            a.registeredAt,
            a.authorizedUntil,
            a.analysesCompleted
        );
    }

    /// @notice Get an AI agent's viewer key
    function getAgentViewerKey(address agent) external view returns (bytes32 x, bytes32 y) {
        require(_agents[agent].isRegistered, "Not registered");
        return (_agents[agent].viewerKey.x, _agents[agent].viewerKey.y);
    }

    /// @notice Get all registered agent addresses
    function getAllAgents() external view returns (address[] memory) {
        return _agentAddresses;
    }

    /// @notice Get total number of registered agents
    function agentCount() external view returns (uint256) {
        return _agentAddresses.length;
    }

    /// @notice Get an analysis request by ID
    function getAnalysisRequest(uint256 requestId) external view returns (
        uint256 id,
        address requester,
        address agent,
        uint256 documentId,
        string memory analysisType,
        uint256 requestedAt,
        bool isCompleted,
        uint256 completedAt
    ) {
        require(requestId < _requestCount, "Invalid request ID");
        AnalysisRequest storage r = _requests[requestId];
        return (
            r.requestId,
            r.requester,
            r.agent,
            r.documentId,
            r.analysisType,
            r.requestedAt,
            r.isCompleted,
            r.completedAt
        );
    }

    /// @notice Get TE-encrypted analysis result (only requester or owner)
    function getEncryptedResult(uint256 requestId) external view returns (bytes memory) {
        require(requestId < _requestCount, "Invalid request ID");
        require(
            msg.sender == _requests[requestId].requester || msg.sender == owner(),
            "Not authorized"
        );
        return _requests[requestId].teEncryptedResult;
    }

    /// @notice Get all request IDs for a requester
    function getRequestsByRequester(address requester) external view returns (uint256[] memory) {
        return _requesterRequests[requester];
    }

    /// @notice Get total number of analysis requests
    function requestCount() external view returns (uint256) {
        return _requestCount;
    }
}
