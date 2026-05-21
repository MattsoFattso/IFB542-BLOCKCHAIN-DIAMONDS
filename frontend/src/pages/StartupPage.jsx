export default function StartupPage({ role, onSelectRole}) {
    return (
        <div className="page">
            <h1>gemvault</h1>
            <p>Diamond Supply Chain</p>
            <p> Your role number: {role ?? "not detected yet"}</p>

            <button onClick={() => onSelectRole("miner")}>Mint a Diamond</button>
            <button onClick={() => onSelectRole("certifier")}>Certify Diamond</button>
            <button onClick={() => onSelectRole("grader")}>Grade/Polish</button>

        </div>
    );
    }