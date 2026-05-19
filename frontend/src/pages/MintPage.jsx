import { useState } from "react";

export default function MainPage({ onNext, onBack}) {
    const [country, setCountry] = useState("");
    const [diamondHash, setDiamondHash] = useState("");

    function handleNext() {
        if (!country) { alert("Please enter a country"); return; }
        if (!diamondHash) { alert("Please enter a diamond hash"); return; }
        onNext();
    }

    return (
        <div className="page">
            <h1>Mint a Rough Diamond</h1>
            <p>Record a new diamond on the blockchain.</p>

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

            {/* insert RoughDiamond() logic*/}
            <button onClick={() =>alert("TO DO: connect mintRoughDiamond()")}>Mint Diamond</button>
            <button onClick={handleNext}>Next: Request Certificate </button>
            <button onClick={onBack}>Back</button>
        </div>
        );
    }