export default function StakeholderConfigPage({ onBack }) {
    return (
        <div className="page">
            <h1>Stakeholder Configuration</h1>
            <p>Register wallet addresses and assign roles here.</p>

            {/* add stakeholder logic?*/}
            <button onClick={() => alert("TODO: connect registerStakeholder()")}>Register Stakeholder</button>

            <button onClick={onBack}>Back</button>
        </div>
        );
    }