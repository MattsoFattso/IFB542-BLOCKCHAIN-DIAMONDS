export default function DiamondMainPage ({ onNext, onBack }) {
    return (
        <div className="page">
            <h1>Diamond - Kimberley Certification</h1>
            <p>Request for a Kimberley Certificate</p>

            {/* insert certifyRoughDiamond() logic*/}

            <button onClick={onNext}>Request Kimberley Certificate </button>
            <button onClick={onBack}> Back</button>
        </div>
        );
    }