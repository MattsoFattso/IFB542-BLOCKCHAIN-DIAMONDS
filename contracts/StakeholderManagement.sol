// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title StakeholderManagement
 * @dev This contract manages all stakeholders within the GemVault system.
 * It enforces role-based access control (RBAC) to ensure that only authorised
 * participants (miners, certifiers, graders) can perform specific transactions.
 *
 * This contract acts as the central authority for validating permissions
 * across other smart contracts in the system.
 */
contract StakeholderManagement {

    /**
     * @dev Enum representing different stakeholder roles in the system
     */
    enum Role { None, Miner, Certifier, Grader }
}