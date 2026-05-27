// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title PolishedDiamond
 * @dev This contract represents the transactions involves with the diamond lifecycle.
 * It links polished diamonds to their original rough diamond
 * and manages the certification and approval of diamonds before they enter the market
 *
 * This contract ensures:
 * - Only certified rough diamonds can be used
 * - Full traceability is maintained
 */

import "./StakeholderManagement.sol";

contract DiamondContract {
    StakeholderContract public stakeholderContract;

    constructor(address _stakeholderContractAddress) {
        stakeholderContract = StakeholderContract(_stakeholderContractAddress);
    }

    modifier onlyMiner() {
        require(
            stakeholderContract.isMiner(msg.sender),
            "Only registered miners can perform this action"
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
        Processed,
        Polished
    }

    // Declare a struct for a diamond

    struct Diamond {
        uint id;
        uint parentId; // 0 = original rough diamond, otherwise links to rough diamond ID
        address owner;
        // Origin data set by the miner
        string origin;
        string RoughDocumentHash;
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
        uint256 caratHundreths;
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

    uint public nextDiamondId = 1; // State variable tracking new rough diamond (ID's don't matter for rough but do matter for polished)


    function mintRoughDiamond(
        string memory _origin,
        string memory _documenthash
    ) external onlyMiner {

        uint newDiamondId = nextDiamondId;

        require(diamonds[newDiamondId].id == 0, "Diamond already exists");
        require(bytes(_origin).length > 0, "Origin cannot be empty");
        require(bytes(_documenthash).length > 0, "Document hash cannot be empty");

        diamonds[newDiamondId] = Diamond({
            id: newDiamondId,
            parentId: 0,
            owner: msg.sender,
            origin: _origin,
            RoughDocumentHash: _documenthash,
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
                caratHundreths: 0
            })
        });

        diamondIds.push(newDiamondId); //Push to chain list
        nextDiamondId++;
        emit RoughDiamondMinted(newDiamondId, msg.sender, _origin); // Emit event for UI
    }

    function getMyDiamonds() external view onlyMiner returns (uint[] memory) {
    uint count = 0;

    for (uint i = 0; i < diamondIds.length; i++) {
        uint diamondId = diamondIds[i];

        if (diamonds[diamondId].owner == msg.sender) {
            count++;
        }
    }

    uint[] memory myDiamondIds = new uint[](count);
    uint index = 0;

    for (uint i = 0; i < diamondIds.length; i++) {
        uint diamondId = diamondIds[i];

        if (diamonds[diamondId].owner == msg.sender) {
            myDiamondIds[index] = diamondId;
            index++;
        }
    }

    return myDiamondIds;
}

    // Miners can also make a polishing request

    enum PolishingRequestStatus {
        Pending, // Rough Diamond waiting to be minted into polished
        Rejected, // Rough diamond that was denied polishing
        Processed // Request that has been processed but still stored on chain
    }

    struct PolishingRequest {
        uint requestId;
        uint roughDiamondId;
        address requester;
        address polisher;
        PolishingRequestStatus status;
        string requestNote;
    }

    mapping(uint => PolishingRequest) public polishingRequests;
    uint[] public polishingRequestIds;
    uint public nextPolishingRequestId = 1;

    // roughDiamondId => whether it already has a pending polishing request
    mapping(uint => bool) public hasPendingPolishingRequest;

    event PolishingRequested(
        uint indexed requestId,
        uint indexed roughDiamondId,
        address indexed requester,
        string requestNote
    );

    function requestPolishing(
        uint _roughDiamondId,
        string memory _requestNote
    ) external onlyMiner {
        Diamond storage d = diamonds[_roughDiamondId];

        require(d.id != 0, "Diamond does not exist");
        require(d.owner == msg.sender, "Only the owner can request polishing");
        require(
            d.state == DiamondState.Certified,
            "Diamond must be certified first"
        );
        require(
            !hasPendingPolishingRequest[_roughDiamondId],
            "Polishing request already exists for this diamond"
        );

        uint requestId = nextPolishingRequestId;

        polishingRequests[requestId] = PolishingRequest({
            requestId: requestId,
            roughDiamondId: _roughDiamondId,
            requester: msg.sender,
            polisher: address(0),
            status: PolishingRequestStatus.Pending,
            requestNote: _requestNote
        });

        hasPendingPolishingRequest[_roughDiamondId] = true;

        polishingRequestIds.push(requestId);
        nextPolishingRequestId++;

        emit PolishingRequested(
            requestId,
            _roughDiamondId,
            msg.sender,
            _requestNote
        );
    }
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

    // View Polish Requests

    function getPendingPolishingRequests()
        external
        view
        onlyGraderPolisher
        returns (uint[] memory)
    {
        uint count = 0;

        for (uint i = 0; i < polishingRequestIds.length; i++) {
            uint requestId = polishingRequestIds[i];

            if (
                polishingRequests[requestId].status ==
                PolishingRequestStatus.Pending
            ) {
                count++;
            }
        }

        uint[] memory pendingIds = new uint[](count);
        uint index = 0;

        for (uint i = 0; i < polishingRequestIds.length; i++) {
            uint requestId = polishingRequestIds[i];

            if (
                polishingRequests[requestId].status ==
                PolishingRequestStatus.Pending
            ) {
                pendingIds[index] = requestId;
                index++;
            }
        }

        return pendingIds;
    }

    // mintPolishedDiamond

    // First create a polish diamond event
    event PolishedDiamondsCreated(
        uint indexed requestId,
        uint indexed roughDiamondId,
        address indexed polisher,
        uint[] polishedDiamondIds
    );

    function mintPolishedDiamond(
        uint _requestId,
        uint[] memory _polishedDiamondIds,
        string[] memory _gradingReportHashes,
        string[] memory _colours,
        string[] memory _clarities,
        string[] memory _cuts,
        uint256[] memory _caratHundreths
    ) external onlyGraderPolisher {
        PolishingRequest storage request = polishingRequests[_requestId];

        require(request.requestId != 0, "Polishing request does not exist");
        require(
            request.status == PolishingRequestStatus.Pending,
            "Request is not pending"
        );

        Diamond storage roughDiamond = diamonds[request.roughDiamondId];

        require(roughDiamond.id != 0, "Rough diamond does not exist");
        require(
            roughDiamond.state == DiamondState.Certified,
            "Rough diamond must be certified"
        );
        require(
            roughDiamond.certification.isCertified,
            "Rough diamond is not Kimberley certified"
        );

        require(
            _polishedDiamondIds.length > 0,
            "Must create at least one polished diamond"
        );

        require(
            _polishedDiamondIds.length == _gradingReportHashes.length &&
                _polishedDiamondIds.length == _colours.length &&
                _polishedDiamondIds.length == _clarities.length &&
                _polishedDiamondIds.length == _cuts.length &&
                _polishedDiamondIds.length == _caratHundreths.length,
            "Input array lengths must match"
        );

        for (uint i = 0; i < _polishedDiamondIds.length; i++) {
            uint polishedId = _polishedDiamondIds[i];

            require(polishedId != 0, "Polished diamond ID cannot be zero");
            require(
                diamonds[polishedId].id == 0,
                "Diamond ID already exists"
            );

            require(
                bytes(_gradingReportHashes[i]).length >= 10,
                "Grading report hash too short"
            );
            require(bytes(_colours[i]).length > 0, "Colour required");
            require(bytes(_clarities[i]).length > 0, "Clarity required");
            require(bytes(_cuts[i]).length > 0, "Cut required");
            require(
                _caratHundreths[i] > 0,
                "Carat weight must be greater than zero"
            );

            diamonds[polishedId] = Diamond({
                id: polishedId,
                parentId: roughDiamond.id,
                owner: request.requester,
                origin: roughDiamond.origin,
                RoughDocumentHash: roughDiamond.RoughDocumentHash,
                state: DiamondState.Polished,
                certification: CertificationData({
                    isCertified: true,
                    certifier: roughDiamond.certification.certifier,
                    certificateHash: roughDiamond.certification.certificateHash
                }),
                grading: GradingData({
                    isGraded: true,
                    grader: msg.sender,
                    gradingReportHash: _gradingReportHashes[i],
                    colour: _colours[i],
                    clarity: _clarities[i],
                    cut: _cuts[i],
                    caratHundreths: _caratHundreths[i]
                })
            });

            diamondIds.push(polishedId);
        }

        roughDiamond.state = DiamondState.Processed;

        request.status = PolishingRequestStatus.Processed;
        request.polisher = msg.sender;

        hasPendingPolishingRequest[request.roughDiamondId] = false;
        emit PolishedDiamondsCreated(
            _requestId,
            roughDiamond.id,
            msg.sender,
            _polishedDiamondIds
        );
    }

    //
}
