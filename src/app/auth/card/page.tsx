"use client";

import { useState } from "react";
import styles from "./card.module.css";
import LoginPage from "@/app/auth/login/page";
import RegisterPage from "@/app/auth/register/page";
import ForgotPasswordPage from "@/app/auth/forgot-password/page";

type Mode = "login" | "register" | "forgot";

export default function CardPage() {
    const [mode, setMode] = useState<Mode>("login");
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleModeChange = (newMode: Mode) => {
        if (newMode === mode) return;
        
        setIsTransitioning(true);
        
        // Para transiciones entre login y forgot (misma cara), delay más corto
        const delay = (mode === "register" || newMode === "register") ? 300 : 150;
        
        setTimeout(() => {
            setMode(newMode);
            setIsTransitioning(false);
        }, delay);
    };

    return (
        <div className={`${styles.card} ${mode === "register" ? styles.flipped : ""} ${isTransitioning ? styles.transitioning : ""}`}>
            {/* Lado frontal → Login/Forgot */}
            <div className={`${styles.cardFace} ${styles.cardFront}`}>
                <div className={`${styles.content} ${mode === "login" && !isTransitioning ? styles.contentVisible : styles.contentHidden}`}>
                    {mode === "login" && (
                        <LoginPage
                            onSwitch={() => handleModeChange("register")}
                            onForgot={() => handleModeChange("forgot")}
                        />
                    )}
                </div>
                <div className={`${styles.content} ${mode === "forgot" && !isTransitioning ? styles.contentVisible : styles.contentHidden}`}>
                    {mode === "forgot" && (
                        <ForgotPasswordPage onBack={() => handleModeChange("login")} />
                    )}
                </div>
            </div>

            {/* Lado trasero → Register */}
            <div className={`${styles.cardFace} ${styles.cardBack}`}>
                <div className={`${styles.content} ${mode === "register" && !isTransitioning ? styles.contentVisible : styles.contentHidden}`}>
                    <RegisterPage onSwitch={() => handleModeChange("login")} />
                </div>
            </div>
        </div>
    );
}