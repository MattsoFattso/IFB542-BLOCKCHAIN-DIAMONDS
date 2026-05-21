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
                const ids = await conract.getUncertifiedRoughDiamonds();
                setDiamonds(ids.map(id => id.toString()));
            } catch (e) {
                setStatus("Error loading diamonds: " + e.message);
            }
        }
            loadDiamonds();
    }, []);

async function handleApprove() {
    if (!selectedId) {alert ("Please select a diamond first"); return; }

    }


    return (
        <div className="page">
            <h1>Diamond - Kimberley Certification</h1>
            <p>Request for a Kimberley Certificate</p>

            {/* insert certifyRoughDiamond() logic*/}

            <button onClick={onNext}>Approve for Certificate </button>
            <button onClick={onBack}> Back</button>
        </div>
        );
    }