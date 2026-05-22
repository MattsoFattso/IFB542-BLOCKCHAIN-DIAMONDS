export default function StartupPage({ role, onSelectRole}) {
    return (
        <div className="page">
            <h1>gemvault</h1>
            <p>Diamond Supply Chain</p>

            <button onClick={() => onSelectRole("miner")}>Mining</button>
            <button onClick={() => onSelectRole("certifier")}>Kimberley Certification</button>
            <button onClick={() => onSelectRole("grader")}>Grade/Polish</button>

        </div>
    );
    }