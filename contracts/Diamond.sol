// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title PolishedDiamond
 * @dev This contract represents the transactions involves with the diamond lifecycle.
 * It links polished diamonds to their original rough diamond
 * and manages ownership and transfer of assets.
 *
 * This contract ensures:
 * - Only certified rough diamonds can be used
 * - Ownership is tracked immutably
 * - Full traceability is maintained
 */

import "./StakeholderManagement.sol";

contract DiamondContract {
    StakeholderContract public stakeholderContract;

    constructor(address _stakeholderContractAddress) {
        stakeholderContract = StakeholderContract(_stakeholderContractAddress);
    }

    modifier onlyRegisteredStakeholder() {
        require(
            stakeholderContract.isRegistered(msg.sender),
            "Stakeholder is not registered"
        );
        _;
    }

    modifier onlyMiner() {
        require(
            stakeholderContract.isMiner(msg.sender),
            "Only registered miners can perform this action"
        );
        _;
    }

    modifier onlyConsumerRetailer() {
        require(
            stakeholderContract.isConsumer(msg.sender),
            "Only registered consumers/retailers can perform this action"
        );
        _;
    }

    modifier onlyKimberleyCertifier() {
        require(
            stakeholderContract.isCertifier(msg.sender),
            "Only Kimberley certifiers can perform this action"
        );
        _;
    }

    modifier onlyGraderPolisher() {
        require(
            stakeholderContract.isGrader(msg.sender),
            "Only graders/polishers can perform this action"
        );
        _;
    }

    enum DiamondState {
        Rough,
        Certified,
        Rejected,
        Polished
    }

    // Declare a struct for a diamond

    struct Diamond {
        uint id;
        uint parentId; // 0 = original rough diamond, otherwise links to rough diamond ID
        address owner;
        // Origin data set by the miner
        string origin;
        // Lifecycle state
        DiamondState state;
        // Kimberley certification data
        CertificationData certification;
        // Grading / polishing data
        // For rough diamonds, this remains empty/default
        GradingData grading;
    }

    struct CertificationData {
        bool isCertified;
        address certifier;
        string certificateHash;
    }

    struct GradingData {
        bool isGraded;
        address grader;
        string gradingReportHash;
        string colour;
        string clarity;
        string cut;
        uint256 carat;
    }

    mapping(uint => Diamond) public diamonds;
    uint[] public diamondIds;

    // Contract Stakeholder Modifiers

    // Miner Functions and Methods

    event RoughDiamondMinted(
        uint indexed diamondId,
        address indexed miner,
        string origin
    );

    function mintRoughDiamond(
        uint _id,
        string memory _origin
    ) external onlyMiner {
        require(_id != 0, "Diamond ID cannot be zero");
        require(diamonds[_id].id == 0, "Diamond already exists");
        require(bytes(_origin).length > 0, "Origin cannot be empty");

        diamonds[_id] = Diamond({
            id: _id,
            parentId: 0,
            owner: msg.sender,
            origin: _origin,
            state: DiamondState.Rough,
            certification: CertificationData({
                isCertified: false,
                certifier: address(0),
                certificateHash: ""
            }),
            grading: GradingData({
                isGraded: false,
                grader: address(0),
                gradingReportHash: "",
                colour: "",
                clarity: "",
                cut: "",
                carat: 0
            })
        });

        diamondIds.push(_id); //Push to chain list

        emit RoughDiamondMinted(_id, msg.sender, _origin); // Emit event for UI
    }

    // Miners can also make a polishing request

    struct PolishingRequest {
        uint roughDiamondId;
        address requester;
        bool isProcessed;
    }

    mapping(uint => PolishingRequest) public polishingRequests;
    uint[] public polishingRequestIds;
    // KIMBERLEY CERTIFIER LOGIC

    // First a view function to get all uncertified rough diamonds for the certifier

    function getUncertifiedRoughDiamonds()
        external
        view
        returns (uint[] memory)
    {
        uint count = 0;

        // First loop: count matching diamonds
        for (uint i = 0; i < diamondIds.length; i++) {
            uint diamondId = diamondIds[i];

            if (
                diamonds[diamondId].state == DiamondState.Rough &&
                diamonds[diamondId].certification.isCertified == false
            ) {
                count++;
            }
        }

        // Create correctly-sized array
        uint[] memory uncertifiedIds = new uint[](count);
        uint index = 0;

        // Second loop: fill array
        for (uint i = 0; i < diamondIds.length; i++) {
            uint diamondId = diamondIds[i];

            if (
                diamonds[diamondId].state == DiamondState.Rough &&
                diamonds[diamondId].certification.isCertified == false
            ) {
                uncertifiedIds[index] = diamondId;
                index++;
            }
        }

        return uncertifiedIds;
    }

    event RoughDiamondCertified(
        uint indexed diamondId,
        address indexed KimberleyAuthority,
        string CertificateHash
    );

    function certifyRoughDiamond(
        uint _diamondId,
        string memory _certificateHash
    ) external onlyKimberleyCertifier {
        Diamond storage d = diamonds[_diamondId];

        require(d.id != 0, "Diamond does not exist");
        require(
            d.state == DiamondState.Rough,
            "Only rough diamonds can be certified"
        );
        require(!d.certification.isCertified, "Diamond already certified");

        require(
            bytes(_certificateHash).length >= 10,
            "Certificate hash is too short"
        );
        require(
            bytes(_certificateHash).length <= 100,
            "Certificate hash is too long"
        );

        d.certification = CertificationData({
            isCertified: true,
            certifier: msg.sender,
            certificateHash: _certificateHash
        });

        d.state = DiamondState.Certified;

        emit RoughDiamondCertified(_diamondId, msg.sender, _certificateHash);
    }

    // As from the BPMN, a certifier can also reject a diamond if they deem it come from a conflict source:

    event RoughDiamondRejected(
        uint indexed diamondId,
        address indexed kimberleyAuthority,
        string rejectionReason
    );

    function rejectRoughDiamond(
        uint _diamondId,
        string memory _reason
    ) external onlyKimberleyCertifier {
        Diamond storage d = diamonds[_diamondId];

        require(d.id != 0, "Diamond does not exist");
        require(
            d.state == DiamondState.Rough,
            "Only rough diamonds can be rejected"
        );
        require(
            !d.certification.isCertified,
            "Certified diamond cannot be rejected"
        );
        require(bytes(_reason).length > 0, "Rejection reason cannot be empty");

        d.state = DiamondState.Rejected;

        emit RoughDiamondRejected(_diamondId, msg.sender, _reason);
    }

    // Polisher/Grader Authority Logic

    //

    //
}
