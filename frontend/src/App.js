import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Main Page and Stakeholder Pages
import StartupPage from "./pages/StartupPage";
import MinerPage from "./pages/MinerPage";
import KimberleyCertifierPage from "./pages/KimberleyCertifierPage";
import PolishingPage from "./pages/PolishingPage";

// Contract Addresses and ABI

import ContractAddresses from "./ContractData/ContractAddresses.js";
import StakeholderABI from "./ContractData/StakeholderContract.json"
import "./App.css";

export default function App() {
    const [page, setPage] = useState("startup");
    const [, setAccount] = useState("");
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
            const contract = new ethers.Contract(ContractAddresses.stakeholderAddress, StakeholderABI, provider);
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
                case "miner": return <MinerPage onNext={() => setPage ("startup")} onBack={() => setPage("startup")} />;
                default: return unauthorised();
            }
        }

        if (role === 2) {
            switch (page) {
                // Kimberley Certifier can only access diamond page
                case "certifier": return <KimberleyCertifierPage onNext={() => setPage("startup")} onBack={() => setPage("startup")} />;
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
            <main className="app-main">
                {renderPage()}
            </main>
        </div>
    );
}

