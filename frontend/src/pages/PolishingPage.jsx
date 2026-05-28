import { useState, useEffect } from "react";
import { ethers } from "ethers";
import config from "../ContractData/ContractAddresses.js";
import DiamondABI from "../ContractData/DiamondContract.json";

import "../css-pages/PolishingPage.css";
import returnImg from "../img/return.png";
import refreshImg from "../img/refresh.png";
import mintImg from "../img/mintPolishedDiamonds.png";

export default function PolishingPage({ onBack }) {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [selectedRequestId, setSelectedRequestId] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [diamondCount, setDiamondCount] = useState(1);
    const [status, setStatus] = useState("");

    // information about the polished diamond
    const [polishedDiamonds, setPolishedDiamonds] = useState([
        {
            polishedDiamondId: "",
            gradingReportHash: "",
            colour: "",
            clarity: "",
            cut: "",
            caratHundreths: ""
        }
    ]);

    useEffect(() => {
        loadPendingRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // creates a write connection to the contract
    async function getSignerContract() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(config.diamondAddress, DiamondABI, signer);
    }

    async function loadPendingRequests() {
        try {
            const contract = await getSignerContract();

            // Solidity: getPendingPolishingRequests() returns uint[] memory
            const ids = await contract.getPendingPolishingRequests();

            const requestDetails = await Promise.all(
                ids.map(async (id) => {
                    // Solidity public mapping getter:
                    // polishingRequests(uint) returns request tuple
                    const request = await contract.polishingRequests(id);

                    return {
                        requestId: request.requestId.toString(),
                        roughDiamondId: request.roughDiamondId.toString(),
                        requester: request.requester,
                        polisher: request.polisher,
                        status: Number(request.status),
                        requestNote: request.requestNote
                    };
                })
            );

            setPendingRequests(requestDetails);
            setStatus("");
        } catch (e) {
            setStatus("Error loading requests: " + e.message);
        }
    }

    function handleSelectRequest(requestId) {
        setSelectedRequestId(requestId);

        const foundRequest = pendingRequests.find(
            (request) => request.requestId === requestId
        );

        setSelectedRequest(foundRequest ?? null);
    }

    function handleDiamondCountChange(value) {
        const count = Number(value);

        if (!count || count < 1) {
            setDiamondCount(1);
            setPolishedDiamonds([
                {
                    polishedDiamondId: "",
                    gradingReportHash: "",
                    colour: "",
                    clarity: "",
                    cut: "",
                    caratHundreths: ""
                }
            ]);
            return;
        }

        setDiamondCount(count);

        const newDiamonds = Array.from({ length: count }, (_, index) => {
            return polishedDiamonds[index] ?? {
                polishedDiamondId: "",
                gradingReportHash: "",
                colour: "",
                clarity: "",
                cut: "",
                caratHundreths: ""
            };
        });

        setPolishedDiamonds(newDiamonds);
    }

    function updatePolishedDiamond(index, field, value) {
        const updated = [...polishedDiamonds];

        updated[index] = {
            ...updated[index],
            [field]: value
        };

        setPolishedDiamonds(updated);
    }

    async function handleMintPolishedDiamonds() {
        if (!selectedRequestId) {
            alert("Please select a polishing request first.");
            return;
        }

        for (let i = 0; i < polishedDiamonds.length; i++) {
            const d = polishedDiamonds[i];

            if (!d.polishedDiamondId) {
                alert(`Please enter polished diamond ID for diamond ${i + 1}.`);
                return;
            }

            if (!d.gradingReportHash) {
                alert(`Please enter grading report hash for diamond ${i + 1}.`);
                return;
            }

            if (!d.colour) {
                alert(`Please enter colour for diamond ${i + 1}.`);
                return;
            }

            if (!d.clarity) {
                alert(`Please enter clarity for diamond ${i + 1}.`);
                return;
            }

            if (!d.cut) {
                alert(`Please enter cut for diamond ${i + 1}.`);
                return;
            }

            if (!d.caratHundreths || Number(d.caratHundreths) <= 0) {
                alert(`Please enter valid carat weight for diamond ${i + 1}.`);
                return;
            }
        }

        try {
            setStatus("Waiting for MetaMask...");

            const contract = await getSignerContract();

            // Solidity expects uint[]
            const polishedDiamondIds = polishedDiamonds.map((d) =>
                Number(d.polishedDiamondId)
            );

            // Solidity expects string[]
            const gradingReportHashes = polishedDiamonds.map((d) =>
                d.gradingReportHash
            );

            // Solidity expects string[]
            const colours = polishedDiamonds.map((d) =>
                d.colour
            );

            // Solidity expects string[]
            const clarities = polishedDiamonds.map((d) =>
                d.clarity
            );

            // Solidity expects string[]
            const cuts = polishedDiamonds.map((d) =>
                d.cut
            );

            // Convert decimal carats into hundredths before sending to Solidity
            // Example: 1.25 becomes 125
            const caratWeights  = polishedDiamonds.map((d) =>
                Math.round(Number(d.caratHundreths) * 100)
            );

            const tx = await contract.mintPolishedDiamond(
                Number(selectedRequestId),
                polishedDiamondIds,
                gradingReportHashes,
                colours,
                clarities,
                cuts,
                caratWeights
            );

            setStatus("Minting polished diamonds on blockchain...");
            await tx.wait();

            setStatus("Polished diamonds have been minted successfully!");

            setSelectedRequestId("");
            setSelectedRequest(null);
            setDiamondCount(1);
            setPolishedDiamonds([
                {
                    polishedDiamondId: "",
                    gradingReportHash: "",
                    colour: "",
                    clarity: "",
                    cut: "",
                    caratHundreths: ""
                }
            ]);

            await loadPendingRequests();
        } catch (e) {
            setStatus("Error minting polished diamonds: " + getErrorReason(e));
        }

    }

function getErrorReason(error) {
    if (error?.reason) {
        return error.reason;
    }

    if (error?.revert?.args?.[0]) {
        return error.revert.args[0];
    }

    if (error?.shortMessage) {
        return error.shortMessage;
    }

    if (error?.message) {
        const reasonMatch = error.message.match(/reason="([^"]+)"/);
        if (reasonMatch) {
            return reasonMatch[1];
        }

        const revertedMatch = error.message.match(/execution reverted: "([^"]+)"/);
        if (revertedMatch) {
            return revertedMatch[1];
        }
    }

    return "Transaction failed.";
}

    return (
        <div className="grader-wrapper">
            <div className="grader-hero">

                {/* Back button */}
                <img src={returnImg} alt="Back" className="grader-back-btn" onClick={onBack}/>
               {status && <p className="grader-status">{status}</p>}

               <div className="grader-grid">
                   {/* Left - Pending Requests */}
                   <div className="grader-section">
                       <div className="grader-field">
                           <label>Polishing Requests:</label>
                           <select value={selectedRequestId} onChange={(e) => handleSelectRequest(e.target.value)}>
                               <option value="">-- Select a Request --</option>
                               {pendingRequests.length === 0 && <option disabled>No pending requests</option>}
                               {pendingRequests.map((request) => (
                                   <option key={request.requestId} value={request.requestId}>Request #{request.requestId} - Diamond #{request.roughDiamondId}</option>
                               ))}
                           </select>
                       </div>
                       <img src={refreshImg} alt="Refresh" className="grader-refresh-btn" onClick={loadPendingRequests}/>

                       {selectedRequest && (
                        <div className="grader-request-info">
                            <p><strong>Request ID:</strong> {selectedRequest.requestId}</p>
                            <p><strong>Rough Diamond:</strong> {selectedRequest.roughDiamondId}</p>
                            <p><strong>Note:</strong> {selectedRequest.requestNote}</p>
                        </div>
                       )}
                   </div>

                   {/* Middle - Diamond Count */}
                   <div className="grader-section">
                       <div className="grader-field">
                           <label>Number of Polished Diamonds:</label>
                           <input type="number" min="1" value={diamondCount} onChange={(e) => handleDiamondCountChange(e.target.value)}/>
                       </div>
                   </div>

                   {/* Right - Scrollable diamond input cards */}
                   <div className="grader-cards-scroll">
                       {polishedDiamonds.map((diamond, index) => (
                           <div key={index} className="grader-diamond-card">
                               <div className="grader-field">
                                   <label>Polished Diamond ID</label>
                                  <input type="number" placeholder="e.g. 900001" value={diamond.polishedDiamondId} onChange={(e) => updatePolishedDiamond(index, "polishedDiamondId", e.target.value)}/>
                              </div>
                               <div className="grader-field">
                                   <label>Grading Report Hash</label>
                                   <input type="text" placeholder="e.g. def1234h61" value={diamond.gradingReportHash} onChange={(e) => updatePolishedDiamond(index, "gradingReportHash", e.target.value)}/>
                               </div>
                               <div className="grader-field">
                                   <label>Colour</label>
                                   <input type="text" placeholder="e.g. D" value={diamond.colour} onChange={(e) => updatePolishedDiamond(index, "colour", e.target.value)}/>
                               </div>
                               <div className="grader-field">
                                   <label>Clarity</label>
                                   <input type="text" placeholder="e.g. VS1" value={diamond.clarity} onChange={(e) => updatePolishedDiamond(index, "clarity", e.target.value)}/>
                               </div>
                               <div className="grader-field">
                                   <label>Cut</label>
                                   <input type="text" placeholder="e.g. Round Brilliant" value={diamond.cut} onChange={(e) => updatePolishedDiamond(index, "cut", e.target.value)}/>
                               </div>
                               <div className="grader-field">
                                   <label>Carat Weight</label>
                                   <input type="number" min="0.01" step="0.01" placeholder="e.g. 1.25" value={diamond.caratHundreths} onChange={(e) => updatePolishedDiamond(index, "caratHundreths", e.target.value)}/>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>

               {/* Mint button bottom right */}
               <div className="grader-mint-btn-row">
                   <img src={mintImg} alt="Mint Polished Diamonds" className="grader-mint-btn" onClick={handleMintPolishedDiamonds} style={{ marginLeft: "1380px"}}/>
               </div>
           </div>
       </div>
    );
}