import { useState, useEffect } from "react";
import { ethers } from "ethers";
import StartupPage from "./pages/StartupPage";
import StakeholderConfigPage from "./pages/StakeholderConfigPage";
import MintPage from "./pages/MintPage";
import DiamondMainPage from "./pages/DiamondMainPage";
import PolishingPage from "./pages/PolishingPage";
import MarketPage from "./pages/MarketPage";
import config from "./config";
import StakeholderABI from "./abi/StakeholderContract.json"
import "./App.css";

const ROLE_NAMES = {
    0: "None",
    1: "Miner",
    2: "Kimberley Certifier",
    3: "Grader/Polisher",
};

export default function App() {
    const [page, setPage] = useState("startup");
    const [account, setAccount] = useState("");
    const [role, setRole] = useState(null);

    // auto-connect metamask
    useEffect(() => {
        async function autoConnect() {
        if (!window.ethereum) return;
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts"});
            const address = accounts[0];
            setAccount(address);

            //Check role and route to correct page
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(config.stakeholderAddress, StakeholderABI, provider);
            const userRole = await contract.getRole(address);
            const roleNum = Number(userRole);
            setRole(roleNum);

            if (roleNum === 1) setPage("miner");
            if (roleNum === 2) setPage("certifier");
            if (roleNum === 3) setPage("grader");


            } catch (e) {
                console.log("Connection error: " + e.message);
            }
        }
        autoConnect();

        if (window.ethereum) {
            window.ethereum.on("accountsChanged", () => window.location.reload());
        }
    },[]);

    function unauthorised() {
        return (
            <div className="page">
                <h1> Access Denied</h1>
                <p>You are not authorised to access this page.</p>
            </div>
        );
    }

    function renderPage() {

        if (role === 1) {
        // miner can only access mint and diamond pages
            switch (page) {
                case "mint": return <MintPage onNext={() => setPage ("diamond")} onBack{() => setPage("mint")} />;
                case "diamond": return <DiamondMainPage onNext={() => setPage("diamond")} onBack={() => setPage("mint")} />;
                default: return <MintPage> onNext{() => setPage("diamond")} onBack={() => setPage("mint")} />;
            }

        if (role === 2) {
            // Kimberley Certifier can only access diamond page
            return <DiamondMainPage onNext{() => setPage("diamond")} onBack={() => setPage("diamond")} />;
        }

        if (role === 3)
            // Grader/Polisher can only access polishing and market page
            case "polishing": return <PolishingPage onNext={() => setPage("market")} onBack={() => setPage("polishing")} />;
            case "market": return<MarketPage onBack={() => setPage("polishing")} />;
            default: return <PolishingPage onNext={() => setPage("market")} onBack={() => setPage("polishing")} />;
        }

        return unauthorised();
    }
    return (
        <div className = "app">
            <header className="app-header">
                <span>gemvault</span>
                <div>
                    {account ? (
                        <span>
                            {account.slice(0,6)}...{account.slice(-4)}
                            {role !== null && <span> - {ROLE_NAMES[role] ?? "Unknown"}</span>}
                        </span>
                    ) : (
                        <span> Connecting...</span>
                    )}
                </div>
            </header>
            <main className="app-main">
                {renderPage()}
            </main>
        </div>
    );
}

