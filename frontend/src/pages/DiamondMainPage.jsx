import { useState, useEffect } from "react";
import { ethers } from "ethers";
import config from "../config";
import DiamondABI from "../abi/DiamondContract.json";

export default function DiamondMainPage ({ onNext, onBack }) {

    const [diamonds, setDiamonds] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [status, setStatus] = useState("");

    // Load uncertified diamonds on page load
    useEffect(() => {
        async function loadDiamonds() {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const contract = new ethers.Contract(config.diamondAddress, DiamondABI, provider);
                const ids = await contract.getUncertifiedRoughDiamonds();
                setDiamonds(ids.map(id => id.toString()));
            } catch (e) {
                setStatus("Error loading diamonds: " + e.message);
            }
        }
        loadDiamonds();
    }, []);

async function handleApprove() {
    if (!selectedId) {alert ("Please select a diamond first"); return; }
    try {
        setStatus("Waiting for MetaMask...");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(config.diamondAddress, DiamondABI, signer);
        const certHash = "KP-CERT-" + selectedId + "-" + Date.now();
        const tx = await contract.certifyRoughDiamond(selectedId, certHash);
        setStatus("Confirming...");
        await tx.wait();
        setStatus("Diamond #" + selectedId + " certified!");
        setSelectedId("");
    } catch (e) {
        setStatus("Error: " + e.message);
    }
}


    return (
        <div className="page">
            <h1>Diamond - Kimberley Certification</h1>
            <p>Select a Diamond to certify.</p>

            {status && <p>{status}</p>}

            <div>
                <label>Diamonds requesting certification</label>
                <br />
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                <option value="">-- Select a diamond -- </option>
                {diamonds.length === 0 && (
                    <option disabled>No diamonds pending.</option>
                )}
                {diamonds.map(id => (
                    <option key ={id} value={id}>Diamond #{id}</option>

                ))}
            </select>
        </div>

        {/* connect certifyRoughDiamond */}

            <button onClick={handleApprove} disabled={!selectedId}>Approve Certificate </button>
            <button onClick={onBack}> Back</button>
        </div>
        );
    }