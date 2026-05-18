export default function StartupPage({ onGoConfig, onGoMint}) {
    return (
        <div className="page">
            <h1>gemvault</h1>
            <p>Diamond Supply Chain</p>

            <button onClick={onGoConfig}>Stakeholder Configuration</button>
            button onClick={onGoMint}>Mint a Diamond</button>
        </div>
    );
    }