// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MockERC8004Registry
/// @notice Mock implementation of ERC-8004 registry for testing
contract MockERC8004Registry {
    struct AgentData {
        string name;
        string endpoint;
        bytes publicKey;
        uint256 registeredAt;
        bool exists;
    }

    mapping(address => AgentData) private agents;

    function register(
        address agent,
        string calldata name,
        string calldata endpoint,
        bytes calldata publicKey
    ) external {
        agents[agent] = AgentData({
            name: name,
            endpoint: endpoint,
            publicKey: publicKey,
            registeredAt: block.timestamp,
            exists: true
        });
    }

    function isRegistered(address agent) external view returns (bool) {
        return agents[agent].exists;
    }

    function getAgent(address agent) external view returns (
        string memory name,
        string memory endpoint,
        bytes memory publicKey,
        uint256 registeredAt
    ) {
        AgentData storage data = agents[agent];
        return (data.name, data.endpoint, data.publicKey, data.registeredAt);
    }
}
