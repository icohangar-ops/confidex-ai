// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DealRoomFactory
 * @notice Factory contract for creating and tracking confidential deal rooms.
 *         Manages role registrations for creators, AI agents, advisors, and auditors.
 */
contract DealRoomFactory is Ownable {
    // ──────────────────── State ────────────────────

    // Role registries
    mapping(address => bool) public isCreator;
    mapping(address => bool) public isAIAgent;
    mapping(address => bool) public isAdvisor;
    mapping(address => bool) public isAuditor;

    // Deal room tracking
    address[] private _allDealRooms;
    mapping(address => bool) private _isDealRoom;

    // creator address => their deal rooms
    mapping(address => address[]) private _creatorDealRooms;

    // deal room address => name
    mapping(address => string) private _dealRoomNames;

    // ──────────────────── Events ────────────────────
    event CreatorRegistered(address indexed creator);
    event CreatorRemoved(address indexed creator);
    event AIAgentRegistered(address indexed agent);
    event AIAgentRemoved(address indexed agent);
    event AdvisorRegistered(address indexed advisor);
    event AdvisorRemoved(address indexed advisor);
    event AuditorRegistered(address indexed auditor);
    event AuditorRemoved(address indexed auditor);
    event DealRoomTracked(address indexed dealRoom, string name, address indexed creator);

    // ──────────────────── Constructor ────────────────────
    constructor(address owner_) Ownable(owner_) {}

    // ──────────────────── Role Registration ────────────────────

    /// @notice Register an address as a deal room creator
    function registerCreator(address creator) external onlyOwner {
        require(creator != address(0), "Zero address");
        require(!isCreator[creator], "Already a creator");

        isCreator[creator] = true;
        emit CreatorRegistered(creator);
    }

    /// @notice Remove a creator
    function removeCreator(address creator) external onlyOwner {
        require(isCreator[creator], "Not a creator");

        isCreator[creator] = false;
        emit CreatorRemoved(creator);
    }

    /// @notice Register an address as an AI agent
    function registerAIAgent(address agent) external onlyOwner {
        require(agent != address(0), "Zero address");
        require(!isAIAgent[agent], "Already an AI agent");

        isAIAgent[agent] = true;
        emit AIAgentRegistered(agent);
    }

    /// @notice Remove an AI agent
    function removeAIAgent(address agent) external onlyOwner {
        require(isAIAgent[agent], "Not an AI agent");

        isAIAgent[agent] = false;
        emit AIAgentRemoved(agent);
    }

    /// @notice Register an address as an advisor
    function registerAdvisor(address advisor) external onlyOwner {
        require(advisor != address(0), "Zero address");
        require(!isAdvisor[advisor], "Already an advisor");

        isAdvisor[advisor] = true;
        emit AdvisorRegistered(advisor);
    }

    /// @notice Remove an advisor
    function removeAdvisor(address advisor) external onlyOwner {
        require(isAdvisor[advisor], "Not an advisor");

        isAdvisor[advisor] = false;
        emit AdvisorRemoved(advisor);
    }

    /// @notice Register an address as an auditor
    function registerAuditor(address auditor) external onlyOwner {
        require(auditor != address(0), "Zero address");
        require(!isAuditor[auditor], "Already an auditor");

        isAuditor[auditor] = true;
        emit AuditorRegistered(auditor);
    }

    /// @notice Remove an auditor
    function removeAuditor(address auditor) external onlyOwner {
        require(isAuditor[auditor], "Not an auditor");

        isAuditor[auditor] = false;
        emit AuditorRemoved(auditor);
    }

    // ──────────────────── Deal Room Tracking ────────────────────

    /// @notice Track a newly created deal room
    /// @param dealRoom Address of the deal room contract
    /// @param name Name of the deal room
    function trackDealRoom(address dealRoom, string calldata name) external {
        require(dealRoom != address(0), "Zero address");
        require(!_isDealRoom[dealRoom], "Already tracked");

        _isDealRoom[dealRoom] = true;
        _dealRoomNames[dealRoom] = name;
        _allDealRooms.push(dealRoom);

        // Also track by the caller as the creator
        _creatorDealRooms[msg.sender].push(dealRoom);

        emit DealRoomTracked(dealRoom, name, msg.sender);
    }

    // ──────────────────── View Functions ────────────────────

    /// @notice Get all tracked deal rooms
    /// @return Array of deal room addresses
    function getAllDealRooms() external view returns (address[] memory) {
        return _allDealRooms;
    }

    /// @notice Get deal rooms created by a specific creator
    /// @param creator The creator address
    /// @return Array of deal room addresses
    function getDealRoomsByCreator(address creator) external view returns (address[] memory) {
        return _creatorDealRooms[creator];
    }

    /// @notice Get total number of tracked deal rooms
    function dealRoomCount() external view returns (uint256) {
        return _allDealRooms.length;
    }

    /// @notice Get the name of a deal room
    /// @param dealRoom The deal room address
    /// @return The name of the deal room
    function getDealRoomName(address dealRoom) external view returns (string memory) {
        return _dealRoomNames[dealRoom];
    }

    /// @notice Check if an address is a tracked deal room
    function isDealRoom(address dealRoom) external view returns (bool) {
        return _isDealRoom[dealRoom];
    }
}
