import { useState, useEffect } from "react";
import { ethers } from "ethers";
import StartupPage from "./pages/StartupPage";
import MintPage from "./pages/MintPage";
import DiamondMainPage from "./pages/DiamondMainPage";
import PolishingPage from "./pages/PolishingPage";
import config from "./config";
import StakeholderABI from "./abi/StakeholderContract.json"
import "./App.css";

const ROLE_NAMES = {
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

            if (roleNum === 1) setPage("startup");
            if (roleNum === 2) setPage("startup");
            if (roleNum === 3) setPage("startup");


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

        if (role === null || page === "startup") {
            return (
                <StartupPage
                    role={role}
                    onSelectRole={(p) =>{
                        if (role === 1 && p === "miner") setPage("miner");
                        else if (role === 2 && p === "certifier") setPage("certifier");
                        else if (role === 3 && p === "grader") setPage("polisher");
                        else alert ("You are not authorised to access this page.");
                    }}
                />
            );
        }
        console.log(role);
        if (role === 1) {
            // miner can only access miner page
            switch (page) {
                case "miner": return <MintPage onNext={() => setPage ("startup")} onBack={() => setPage("startup")} />;
                default: return unauthorised();
            }
        }

        if (role === 2) {
            switch (page) {
                // Kimberley Certifier can only access diamond page
                case "certifier": return <DiamondMainPage onNext={() => setPage("startup")} onBack={() => setPage("startup")} />;
                default: return unauthorised();
            }
        }

        if (role === 3)
            switch (page) {
                // Grader/Polisher can only access polishing and market page
                case "polisher": return <PolishingPage onNext={() => setPage("market")} onBack={() => setPage("startup")} />;
                default: return unauthorised();
            }
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

