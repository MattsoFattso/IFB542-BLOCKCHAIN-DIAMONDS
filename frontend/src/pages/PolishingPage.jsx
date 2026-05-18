export default function PolishingPage({ onNext, onBack}) {
    return (
        <div className="page">
            <h1>Polish & Grade Diamond</h1>
            <p>Certificate verified. Grant polishing and grading.</p>

            {/* insert mintPolishedDiamond() logic*/}
            <button onClick={onNext}>Start Polishing</button>

            <button onClick={onBack}>Back</button>
        </div>
        );
    }