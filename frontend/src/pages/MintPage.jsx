import { useState, useEffect } from "react";
import { ethers } from "ethers";
import config from "../config"
import DiamondABI from "../abi/DiamondContract.json";

const DIAMOND_STATES = {
    1: "Rough",
    2: "Certified",
    3: "Polished"
};

export default function MintPage({ onNext, onBack}) {
    const [country, setCountry] = useState("");
    const [diamondHash, setDiamondHash] = useState("");
    const [certifiedDiamonds, setCertifiedDiamonds] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [requestNote, setRequestNote] = useState("");
    const [status, setStatus] = useState("");
    const [myDiamonds, setMyDiamonds] = useState([]);


    // Load diamonds on page
    useEffect(() => {
        loadMyDiamonds();
    }, []);

    async function getSignerContract() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(config.diamondAddress, DiamondABI, signer)
    }

    async function loadMyDiamonds() {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(config.diamondAddress, DiamondABI, signer);
            const ids = await contract.getMyDiamonds();

            // Fetch details of each diamond
            const details = await Promise.all (
                ids.map(async(id) => {
                    const d = await contract.diamonds(id);
                    return {
                        id: d.id.toString(),
                        origin: d.origin,
                        hash: d.RoughDocumentHash,
                        state: DIAMOND_STATES[Number(d.state)] ?? "Unknown",
                        stateNum: Number(d.state),
                    };
                })
            );

            setMyDiamonds(details);

            // only certified diamonds can request polishing
            const certified = details.filter(d => d.stateNum === 1);
            setCertifiedDiamonds(certified.map(d => d.id));
        } catch (e) {
            setStatus("Error loading diamonds: " + e.message);
        }
    }

    async function handleMint() {
        if (!country) { alert("Please enter a country"); return; }
        if (!diamondHash) { alert("Please enter a diamond here"); return; }
        try {
            setStatus("Waiting for MetaMask...");
            const contract = await getSignerContract();
            const tx = await contract.mintRoughDiamond(country, diamondHash);
            setStatus("Minting on blockchain...");
            await tx.wait();
            setStatus("Diamond minted successfully!");
            setCountry("");
            setDiamondHash("");
            loadMyDiamonds();
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

            {/* Diamonds Table */}
            <h2>Owned Diamonds - Rough and Polished</h2>
            <button onClick={loadMyDiamonds}>Refresh</button>
            {myDiamonds.length === 0 ? (
                <p>No diamonds found.</p>
            ) : (
                <table border ="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse"}}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Origin</th>
                            <th>Document</th>
                            <th>State</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myDiamonds.map(d => (
                            <tr key ={d.id}>
                                <td>#{d.origin}</td>
                                <td>#{d.hash}</td>
                                <td>#{d.state}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <hr />

            {/* Mining a Rough Diamond */}
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