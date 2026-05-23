import { useState, useEffect } from "react";
import { ethers } from "ethers";
import config from "../ContractData/ContractAddresses.js";
import DiamondABI from "../ContractData/DiamondContract.json";

export default function DiamondMainPage({ onNext, onBack }) {
    const [diamonds, setDiamonds] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        loadDiamonds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function getSignerContract() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(config.diamondAddress, DiamondABI, signer);
    }

    async function getProviderContract() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        return new ethers.Contract(config.diamondAddress, DiamondABI, provider);
    }

    async function loadDiamonds() {
        try {
            setStatus("Loading pending diamonds...");

            const contract = await getProviderContract();
            const ids = await contract.getUncertifiedRoughDiamonds();

            setDiamonds(ids.map(id => id.toString()));
            setStatus("");
        } catch (e) {
            setStatus("Error loading diamonds: " + getErrorReason(e));
        }
    }

    async function handleApprove() {
        if (!selectedId) {
            alert("Please select a diamond first.");
            return;
        }

        try {
            setStatus("Waiting for MetaMask...");

            const contract = await getSignerContract();

            const certHash = "KP-CERT-" + selectedId + "-" + Date.now();

            const tx = await contract.certifyRoughDiamond(selectedId, certHash);

            setStatus("Confirming certification...");
            await tx.wait();

            setStatus("Diamond #" + selectedId + " certified!");

            setSelectedId("");
            setRejectReason("");

            await loadDiamonds();
        } catch (e) {
            setStatus("Error approving certificate: " + getErrorReason(e));
        }
    }

    async function handleReject() {
        if (!selectedId) {
            alert("Please select a diamond first.");
            return;
        }

        if (!rejectReason) {
            alert("Please enter a rejection reason.");
            return;
        }

        try {
            setStatus("Waiting for MetaMask...");

            const contract = await getSignerContract();

            const tx = await contract.rejectRoughDiamond(
                selectedId,
                rejectReason
            );

            setStatus("Confirming rejection...");
            await tx.wait();

            setStatus("Diamond #" + selectedId + " rejected.");

            setSelectedId("");
            setRejectReason("");

            await loadDiamonds();
        } catch (e) {
            setStatus("Error rejecting certificate: " + getErrorReason(e));
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
            <h1>Diamond - Kimberley Certification</h1>
            <p>Select a rough diamond to approve or reject.</p>

            {status && <p>{status}</p>}

            <div>
                <label>Diamonds requesting certification</label>
                <br />

                <select
                    value={selectedId}
                    onChange={e => setSelectedId(e.target.value)}
                >
                    <option value="">-- Select a diamond --</option>

                    {diamonds.length === 0 && (
                        <option disabled>No diamonds pending.</option>
                    )}

                    {diamonds.map(id => (
                        <option key={id} value={id}>
                            Diamond #{id}
                        </option>
                    ))}
                </select>
            </div>

            <br />

            <div>
                <label>Rejection Reason</label>
                <br />
                <input
                    type="text"
                    placeholder="e.g. Origin documents could not be verified"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                />
            </div>

            <br />

            <button onClick={handleApprove} disabled={!selectedId}>
                Approve Certificate
            </button>

            <button
                onClick={handleReject}
                disabled={!selectedId}
                style={{ marginLeft: "8px" }}
            >
                Reject Certificate
            </button>

            <button onClick={onBack} style={{ marginLeft: "8px" }}>
                Back
            </button>
        </div>
    );
}