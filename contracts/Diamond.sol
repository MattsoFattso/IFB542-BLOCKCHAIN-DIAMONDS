// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;



import "./StakeholderManagement.sol";

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

contract DiamondContract {
    StakeholderContract public stakeholderContract;

    constructor(address _stakeholderContractAddress) {
        stakeholderContract = StakeholderContract(_stakeholderContractAddress);
    }

    // This calls modifier functions form the stakeholder management contract

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

    // This creates a pre-defined enum structure of each diamond state to change and read it during supply chain

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

    // This is the struct for the certification stakeholder to change the diamond

    struct CertificationData {
        bool isCertified;
        address certifier;
        string certificateHash;
    }

    // This is the struct for the grading stakeholder to alter and add to a diamond

    struct GradingData {
        bool isGraded;
        address grader;
        string gradingReportHash;
        string colour;
        string clarity;
        string cut;
        uint256 caratHundreths;
    }

    // Main diamond mapping state for the blockchain

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

    /// @notice Mints a new rough diamond and assigns ownership to the calling miner.
    /// @dev Only registered miners can call this function. The diamond is created in the Rough state
    ///      and starts uncertified and ungraded. A RoughDiamondMinted event is emitted for frontend tracking.
    /// @param _origin The origin or mining location of the rough diamond.
    /// @param _documenthash A document hash or off-chain reference proving the diamond's rough origin data.

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

    /// @notice Returns all diamond IDs owned by the calling miner.
    /// @dev This function loops through the full diamondIds array twice:
    ///      once to count owned diamonds and once to populate the return array.
    ///      This is acceptable as a view function but may become inefficient if the diamond list grows large.
    /// @return myDiamondIds An array containing the IDs of diamonds owned by the caller.

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

    // Miners can also make a polishing request, this declares an enum of the status

    enum PolishingRequestStatus {
        Pending, // Rough Diamond waiting to be minted into polished
        Rejected, // Rough diamond that was denied polishing
        Processed // Request that has been processed but still stored on chain
    }

    // Polishing request struct to be read by the polishing stakeholder

    struct PolishingRequest {
        uint requestId;
        uint roughDiamondId;
        address requester;
        address polisher;
        PolishingRequestStatus status;
        string requestNote;
    }

    // Mapping of all the polishing requests

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

    /// @notice Creates a polishing request for a certified rough diamond.
    /// @dev Only the miner who owns the rough diamond can request polishing.
    ///      The diamond must exist, be owned by the caller, and already be certified.
    ///      A rough diamond can only have one pending polishing request at a time.
    ///      When successful, the request is stored on-chain and a PolishingRequested event is emitted.
    /// @param _roughDiamondId The ID of the certified rough diamond being submitted for polishing.
    /// @param _requestNote Optional note or instruction attached to the polishing request.

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

    /// @notice Returns all rough diamonds that have not yet been certified.
    /// @dev This view function loops through all diamond IDs twice:
    ///      first to count uncertified rough diamonds, then to populate a correctly-sized return array.
    ///      It is intended to support the Kimberley Certifier frontend page.
    /// @return uncertifiedIds An array of rough diamond IDs that are still awaiting certification.

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

    /// @notice Certifies a rough diamond and updates its lifecycle state to Certified.
    /// @dev Only a registered Kimberley Certifier can call this function.
    ///      The diamond must exist, must currently be in the Rough state, and must not already be certified.
    ///      The certificate hash is validated for a basic length range before being stored on-chain.
    /// @param _diamondId The ID of the rough diamond being certified.
    /// @param _certificateHash The certificate hash or off-chain document reference proving Kimberley approval.

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

    /// @notice Rejects a rough diamond if it fails Kimberley certification checks.
    /// @dev Only a registered Kimberley Certifier can call this function.
    ///      The diamond must exist, must still be in the Rough state, and must not already be certified.
    ///      Rejected diamonds have their lifecycle state updated to Rejected.
    /// @param _diamondId The ID of the rough diamond being rejected.
    /// @param _reason The reason for rejecting the rough diamond.

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

    /// @notice Returns all polishing requests that are currently pending.
    /// @dev Only registered Grader/Polisher accounts can call this function.
    ///      The function loops through all polishing request IDs twice:
    ///      first to count pending requests, then to populate a correctly-sized return array.
    ///      It is mainly used by the Polisher/Grader frontend page to display available requests.
    /// @return pendingIds An array of polishing request IDs that are still pending.

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

    /// @notice Processes a certified rough diamond into one or more polished diamonds.
    /// @dev Only a registered Grader/Polisher can call this function.
    ///      The polishing request must exist and still be pending.
    ///      The linked rough diamond must exist, be certified, and have valid Kimberley certification data.
    ///      Each polished diamond receives a new ID, inherits the rough diamond's origin and certification data,
    ///      and stores its own grading information.
    ///      After processing, the rough diamond is marked as Processed, the request is marked as Processed,
    ///      and the pending request flag is cleared.
    /// @param _requestId The ID of the polishing request being processed.
    /// @param _polishedDiamondIds The new IDs to assign to the polished diamonds.
    /// @param _gradingReportHashes The grading report hashes or off-chain grading references for each polished diamond.
    /// @param _colours The colour grades for each polished diamond.
    /// @param _clarities The clarity grades for each polished diamond.
    /// @param _cuts The cut descriptions or cut grades for each polished diamond.
    /// @param _caratHundreths The carat weights for each polished diamond, stored in hundredths.

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

        // Check all the inputted variables for any input errors (improve in extensions)

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

        // Iterate through each diamonds to mint them individually on the chain (one transaction, multiple state changes)

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

            // Push each new diamonds to the chain

            diamondIds.push(polishedId);
        }

        roughDiamond.state = DiamondState.Processed;

        request.status = PolishingRequestStatus.Processed;
        request.polisher = msg.sender;

        // Change polishing request status and rough diamond state so the miner can know the rough diamond doesn't exist anymore

        hasPendingPolishingRequest[request.roughDiamondId] = false;
        emit PolishedDiamondsCreated(
            _requestId,
            roughDiamond.id,
            msg.sender,
            _polishedDiamondIds
        );
    }
}
