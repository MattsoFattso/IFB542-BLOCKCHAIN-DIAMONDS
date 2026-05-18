export default function MarketPage ({ onBack }) {
    return (
        <div className="page">
            <h1>Diamond Market</h1>
            <p>Your diamond is polished and ready for selling.</p>

            {/*Insert sell logic*/}
            <button onClick={() => alert("TO DO: connect sell to market")}>Sell to Market</button>

            <button onClick={onBack}>Back to Start</button>
        </div>
    );
}