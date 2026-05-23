import { useState, useEffect } from "react";
import { ethers } from "ethers";
import config from "../config";
import DiamondABI from "../abi/DiamondContract.json";

export default function PolishingPage({ onBack }) {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [selectedRequestId, setSelectedRequestId] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [diamondCount, setDiamondCount] = useState(1);
    const [status, setStatus] = useState("");

    const [polishedDiamonds, setPolishedDiamonds] = useState([
        {
            polishedDiamondId: "",
            gradingReportHash: "",
            colour: "",
            clarity: "",
            cut: "",
            caratWeight: ""
        }
    ]);

    useEffect(() => {
        loadPendingRequests();
    }, []);

    async function getSignerContract() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(config.diamondAddress, DiamondABI, signer);
    }

    async function loadPendingRequests() {
        try {
            setStatus("Loading pending polishing requests...");

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
                    caratWeight: ""
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
                caratWeight: ""
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

            if (!d.caratWeight || Number(d.caratWeight) <= 0) {
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

            // Solidity expects uint256[]
            const caratWeights = polishedDiamonds.map((d) =>
                Number(d.caratWeight)
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
                    caratWeight: ""
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
        <div className="page">
            <h1>Grader / Polisher Dashboard</h1>

            {status && <p>{status}</p>}

            <h2>Pending Polishing Requests</h2>

            <button onClick={loadPendingRequests}>Refresh Requests</button>

            <div>
                <label>Polishing Request</label>
                <br />
                <select
                    value={selectedRequestId}
                    onChange={(e) => handleSelectRequest(e.target.value)}
                >
                    <option value="">-- Select a Request --</option>

                    {pendingRequests.length === 0 && (
                        <option disabled>No pending polishing requests</option>
                    )}

                    {pendingRequests.map((request) => (
                        <option
                            key={request.requestId}
                            value={request.requestId}
                        >
                            Request #{request.requestId} - Rough Diamond #{request.roughDiamondId}
                        </option>
                    ))}
                </select>
            </div>

            {selectedRequest && (
                <div>
                    <h3>Selected Request</h3>
                    <p><strong>Request ID:</strong> {selectedRequest.requestId}</p>
                    <p><strong>Rough Diamond ID:</strong> {selectedRequest.roughDiamondId}</p>
                    <p><strong>Requester:</strong> {selectedRequest.requester}</p>
                    <p><strong>Request Note:</strong> {selectedRequest.requestNote}</p>
                </div>
            )}

            <hr />

            <h2>Mint Polished Diamonds</h2>

            <div>
                <label>Number of Polished Diamonds</label>
                <br />
                <input
                    type="number"
                    min="1"
                    value={diamondCount}
                    onChange={(e) => handleDiamondCountChange(e.target.value)}
                />
            </div>

            {polishedDiamonds.map((diamond, index) => (
                <div
                    key={index}
                    style={{
                        border: "1px solid #ccc",
                        padding: "12px",
                        marginTop: "12px"
                    }}
                >
                    <h3>Polished Diamond {index + 1}</h3>

                    <div>
                        <label>Polished Diamond ID</label>
                        <br />
                        <input
                            type="number"
                            placeholder="e.g. 900001"
                            value={diamond.polishedDiamondId}
                            onChange={(e) =>
                                updatePolishedDiamond(
                                    index,
                                    "polishedDiamondId",
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div>
                        <label>Grading Report Hash</label>
                        <br />
                        <input
                            type="text"
                            placeholder="e.g. ipfs://QmGradingReport001"
                            value={diamond.gradingReportHash}
                            onChange={(e) =>
                                updatePolishedDiamond(
                                    index,
                                    "gradingReportHash",
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div>
                        <label>Colour</label>
                        <br />
                        <input
                            type="text"
                            placeholder="e.g. D"
                            value={diamond.colour}
                            onChange={(e) =>
                                updatePolishedDiamond(
                                    index,
                                    "colour",
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div>
                        <label>Clarity</label>
                        <br />
                        <input
                            type="text"
                            placeholder="e.g. VS1"
                            value={diamond.clarity}
                            onChange={(e) =>
                                updatePolishedDiamond(
                                    index,
                                    "clarity",
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div>
                        <label>Cut</label>
                        <br />
                        <input
                            type="text"
                            placeholder="e.g. Round Brilliant"
                            value={diamond.cut}
                            onChange={(e) =>
                                updatePolishedDiamond(
                                    index,
                                    "cut",
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div>
                        <label>Carat Weight</label>
                        <br />
                        <input
                            type="number"
                            min="1"
                            placeholder="e.g. 1"
                            value={diamond.caratWeight}
                            onChange={(e) =>
                                updatePolishedDiamond(
                                    index,
                                    "caratWeight",
                                    e.target.value
                                )
                            }
                        />
                    </div>
                </div>
            ))}

            <br />

            <button
                onClick={handleMintPolishedDiamonds}
                disabled={!selectedRequestId}
            >
                Mint Polished Diamonds
            </button>

            <hr />

            <button onClick={onBack}>Back</button>
        </div>
    );
}