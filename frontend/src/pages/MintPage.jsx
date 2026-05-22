import { useState, useEffect } from "react";
import { ethers } from "ethers";
import config from "../config"
import DiamondABI from "../abi/DiamondContract.json";

export default function MintPage({ onNext, onBack}) {
    const [country, setCountry] = useState("");
    const [diamondHash, setDiamondHash] = useState("");
    const [certifiedDiamonds, setCertifiedDiamonds] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [requestNote, setRequestNote] = useState("");
    const [status, setStatus] = useState("");


    // Load certified diamonds on page
    useEffect(() => {
        loadCertifiedDiamonds();
    }, []);

    async function loadCertifiedDiamonds() {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(config.diamondAddress, DiamondABI, signer);
            const ids = await contract.getMyDiamonds();
            setCertifiedDiamonds(ids.map(id => id.toString()));
        } catch (e) {
            setStatus ("Error loading diamonds: " + e.message);
        }
    }

    // Mint rough diamond
    async function handleMint() {
        if (!country) { alert("Please enter a country"); return; }
        if (!diamondHash) { alert("Please enter a diamond hash"); return; }
        try {
            setStatus("Waiting for MetaMask...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(config.diamondAddress, DiamondABI, signer);
            const tx = await contract.mintRoughDiamond(country, diamondHash);
            setStatus("Minting on blockchain...");
            await tx.wait();
            setStatus("Diamond minted successfully.");
        } catch (e) {
            setStatus("Error: " + e.message);
        }

    }

    async function handleRequestPolish() {
        if (!selectedId) { alert("Please select a diamond first."); return; }
        if (!requestNote) { alert ("Please enter a request note."); return; }
        try {
            setStatus("Waiting for MetaMask...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract (config.diamondAddress, DiamondABI, signer);
            const tx = await contract.requestPolishing(selectedId, requestNote);
            setStatus("Submitting polish request...");
            await tx.wait();
            setStatus("Polish request submitted for Diamond #" + selectedId + "!");
            setSelectedId("");
        } catch (e) {
            setStatus("Error: " + e.message);
        }
    }

    return (
        <div className="page">
            <h1>Miner Dashboard</h1>

            {status && <p>{status}</p>}

            <h2>Mine a Rough Diamond</h2>
            <div>
                <label>Country of Origin</label>
                <br />
                <input type="text" placeholder="e.g. XXXX" value ={country} onChange={e => setCountry(e.target.value)}
                />
            </div>

            <div>
                <label>Rough Diamond Hash</label>
                <br />
                <input type ="text" placeholder="e.g. RD-2024-00041" value={diamondHash} onChange={e => setDiamondHash(e.target.value)}
                />
            </div>
            <button onClick={handleMint}>Mine Diamond</button>

            <hr />
            <h2> Request Polishing</h2>
            <p> Select a certified diamond to polish.</p>
            <div>
                <label>Certified Diamonds</label>
                <br />
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                    <option value="">-- Select a Diamond --</option>
                    {certifiedDiamonds.length === 0 && <option disabled> No certified diamonds</option>}
                    {certifiedDiamonds.map(id => (
                        <option key= {id} value={id}>Diamond #{id}</option>
                    ))}
                </select>
                </div>

                <div>
                    <label> Request Note</label>
                    <br />
                    <input type="text" placeholder="e.g. Please cut into 3 pieces" value={requestNote} onChange={e => setRequestNote(e.target.value)} />
                </div>
                <button onClick={handleRequestPolish} disabled={!selectedId}>Request Polishing</button>

                <hr />
                <button onClick={onBack}>Back</button>
            </div>
        );
    }