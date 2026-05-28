// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title StakeholderManagement
 * @dev This contract manages all stakeholders within the GemVault system.
 * It enforces role-based access control (RBAC) to ensure that only authorised
 * participants (miners, certifiers, graders) can perform specific transactions.
 *
 * This contract acts as the central authority for validating permissions
 * across other smart contracts in the system.
 */
contract StakeholderContract {

    enum Role {
        None, // 0
        Miner, // 1
        KimberleyCertifier, // 2
        GraderPolisher // 3
    }

    struct Stakeholder {
        Role role;
        bool isRegistered;
    }

    // Maps each stakeholder to a role and address

    mapping(address => Stakeholder) public stakeholders;

    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    // Basic functions to check stakeholder rights and privileges

    function registerStakeholder(address _addr, Role _role) public onlyAdmin {
        stakeholders[_addr] = Stakeholder(_role, true);
    }

    function removeStakeholder(address _addr) public onlyAdmin {
        delete stakeholders[_addr];
    }

    function getRole(address _addr) public view returns (Role) {
        return stakeholders[_addr].role;
    }

    function isRegistered(address _addr) public view returns (bool) {
        return stakeholders[_addr].isRegistered;
    }

    // Helper functions (used by DiamondContract)

    function isMiner(address _addr) public view returns (bool) {
        return stakeholders[_addr].role == Role.Miner;
    }

    function isCertifier(address _addr) public view returns (bool) {
        return stakeholders[_addr].role == Role.KimberleyCertifier;
    }

    function isGrader(address _addr) public view returns (bool) {
        return stakeholders[_addr].role == Role.GraderPolisher;
    }
}