export default function MainPage({ inNext, onBack}) {
    return (
        <div className="page">
            <h1>Mint a Rough Diamond</h1>
            <p>Record a new diamond on the blockchain.</p>

            {/* insert RoughDiamond() logic*/}
            <button onClick={() =>alert("TO DO: connect mintRoughDiamond()")}>Mint Diamond</button>

            <button onClick={onNext}>Next: Request Certificate </button>
            <button onClick={onBack}>Back</button>
        </div>
        );
    }