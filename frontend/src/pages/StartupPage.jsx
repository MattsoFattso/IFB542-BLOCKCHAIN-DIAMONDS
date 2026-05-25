import "./StartupPage.css";
import minerImg from "../img/miner-button.png";
import certifyImg from "../img/certify-button.png";
import gradeImg from "../img/grade.polish-button.png";

export default function StartupPage({ role, onSelectRole}) {
    const roleLabel =
        role === 1 ? "Miner" :
        role === 2 ? "Kimberley Certifier" :
        role === 3 ? "Grader" : "connecting...";

    return (
        <div className ="startup-wrapper">


                {/* Full background image */}
                <div className="startup-hero">

                    {/* Welcome text */}
                    <h1 className="welcome-text">Welcome back,</h1>
                    <h2 className ="role-text">{roleLabel} .</h2>

                    {/* Clickable image cards */}
                    <div className="startup-cards">
                        <img src={minerImg} alt="Mine a Diamond" className="role-card" onClick={() => onSelectRole("miner")} />
                        <img src={certifyImg} alt="Certify Diamond" className="role-card" onClick={() => onSelectRole("certifier")} />
                        <img src={gradeImg} alt="Grade/Polish" className="role-card" onClick={() => onSelectRole("grader")} />
                    </div>
                </div>
        </div>
    );
}