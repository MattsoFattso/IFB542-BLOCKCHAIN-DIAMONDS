import { useState } from "react";
import StartupPage from "./pages/StartupPage";
import StakeholderConfigPage from "./pages/StakeholderConfigPage";
import MintPage from "./pages/MintPage";
import DiamondMainPage from "./pages/DiamondMainPage";
import PolishingPage from "./pages/PolishingPage";
import MarketPage from "./pages/MarketPage";
import "./App.css";

export default function App() {
    const [page, setPage] = useState("startup");

    function renderPage() {
        switch (page) {
            case "startup": return<StartupPage onGoConfig={() => setPage("config")} onGoMint={() => setPage("mint")} />;
            case "config": return<StakeholderConfigPage onBack={() => setPage("startup")} />;
            case "mint": return<MintPage onNext={() => setPage("diamond")} onBack={() => setPage("startup")} />;
            case "diamond": return<DiamondMainPage onNext={() => setPage("polishing")} onBack={() => setPage("mint")} />;
            case "polishing": return<PolishingPage onNext={() => setPage("market")} onBack={() => setPage("diamond")} />;
            case "market": return<MarketPage onBack={() => setPage("startup")} />;
            default: return<StartupPage />;
        }
    }
    return (
        <div> className = "app">
            <header className="app-header">
                <span>gemvault</span>
            </header>
            <main className="app-main">
                {renderPage()}
            </main>
        </div>
    );
}

