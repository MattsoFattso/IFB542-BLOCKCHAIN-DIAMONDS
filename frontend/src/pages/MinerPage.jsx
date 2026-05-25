import { useState, useEffect } from "react";
import { ethers } from "ethers";
import config from "../ContractData/ContractAddresses.js"
import DiamondABI from "../ContractData/DiamondContract.json";
import "./MinerPage.css";

import returnImg from "../img/return.png";
import mineDiamondImg from "../img/mine-diamond.png";
import requestImg from "../img/request.png";
import refreshImg from "../img/refresh.png";


const DIAMOND_STATES = {
    0: "Rough",
    1: "Certified",
    2: "Rejected",
    3: "Processed",
    4: "Polished"
};

export default function MinerPage({ onNext, onBack}) {
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
                        parentId: d.parentId.toString(),
                        origin: d.origin,
                        roughDocumentHash: d.RoughDocumentHash,
                        state: DIAMOND_STATES[Number(d.state)] ?? "Unknown",
                        stateNum: Number(d.state),

                        gradingReportHash: d.grading.gradingReportHash,
                        colour: d.grading.colour,
                        clarity: d.grading.clarity,
                        cut: d.grading.cut,
                        caratHundreths: (Number(d.grading.caratHundreths) / 100).toFixed(2)
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
            const contract = await getSignerContract();
            const tx = await contract.mintRoughDiamond(country, diamondHash);
            await tx.wait();
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
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract (config.diamondAddress, DiamondABI, signer);
            const tx = await contract.requestPolishing(selectedId, requestNote);
            await tx.wait();
            setSelectedId("");
        } catch (e) {
            setStatus("Error: " + e.message);
        }
    }

    return (
        <div className="miner-wrapper">
            <div className="miner-hero">

                {status && <p className="miner-status">{status}</p>}

                {/* top section */}
                <div className="miner-top-grid">

                    {/* Mine a diamond */}
                    <div className="miner-section">
                        <div className="miner-field">
                            <label>Country of origin:</label>
                            <input type="text" placeholder="e.g China" value={country} onChange={e => setCountry(e.target.value)}/>
                        </div>
                        <div className="miner-field">
                            <label>Rough Diamond Hash:</label>
                            <input type="text" placeholder="e.g. RD-1234-5678" value={diamondHash} onChange={e => setDiamondHash(e.target.value)}/>
                        </div>
                        <img src={mineDiamondImg} alt="Mine Diamond" className="miner-action-btn" onClick={handleMint}/>
                    </div>

                    {/* Request Polishing */}
                    <div className="miner-section">
                        <div className="miner-field">
                            <label>Certified Diamonds: </label>
                            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                                <option value="">--Select a diamond--</option>
                                {certifiedDiamonds.length === 0 && <option disabled>No certified Diamonds</option>}
                                {certifiedDiamonds.map(id => (<option key={id} value={id}>Diamond #{id}</option>
                                ))}
                            </select>
                        </div>
                        <div className="miner-field">
                            <label>Request Note:</label>
                            <input type="text" placeholder="e.g. Please cut into 3 pieces" value={requestNote} onChange={e => setRequestNote(e.target.value)}/>
                        </div>
                        <img src ={requestImg} alt="Request" className="miner-action-btn" onClick={handleRequestPolish}/>
                    </div>
                </div>

                    {/* Table */}
                        <div className="miner-table-header">
                            <img src={refreshImg} alt="Refresh" className="miner-refresh-btn" onClick={loadMyDiamonds}/>
                        </div>


                    <div className="miner-table-section">
                        {myDiamonds.length === 0 ? (
                            <p>No diamonds found.</p>
                        ) : (
                            <table className="diamond-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>ID</th>
                                        <th>Parent ID</th>
                                        <th>Origin</th>
                                        <th>Document / Report Hash</th>
                                        <th>State</th>
                                        <th>Grading Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myDiamonds.map(d => (
                                        <tr key={d.id}>
                                            <td>
                                                {d.stateNum === 4 ? "Polished Diamond" : "Rough Diamond"}
                                            </td>
                                            <td>#{d.id}</td>
                                            <td>
                                                {d.parentId === "0" ? "-" : `#${d.parentId}`}
                                            </td>
                                            <td>{d.origin}</td>
                                            <td className="hash-cell">
                                                {d.stateNum === 4
                                                    ? d.gradingReportHash
                                                    : d.roughDocumentHash}
                                            </td>
                                            <td>{d.state}</td>
                                            <td>
                                                {d.stateNum === 4 ? (
                                                    <>
                                                        <div><strong>Colour:</strong> {d.colour}</div>
                                                        <div><strong>Clarity:</strong> {d.clarity}</div>
                                                        <div><strong>Cut:</strong> {d.cut}</div>
                                                        <div><strong>Carat:</strong> {d.caratHundreths}</div>
                                                    </>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Back */}
                    <img src={returnImg} alt ="Back" className="miner-back-btn" onClick={onBack}/>
                </div>
        </div>
    );
}
