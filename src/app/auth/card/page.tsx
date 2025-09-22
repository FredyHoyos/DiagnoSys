"use client";

import { useState } from "react";
import styles from "./card.module.css";
import LoginForm from "@/app/auth/login/login";
import RegisterForm from "@/app/auth/register/register";
import ForgotPasswordForm from "@/app/auth/forgot-password/forgot-password";

type Mode = "login" | "register" | "forgot";

export default function CardPage() {
    const [mode, setMode] = useState<Mode>("login");
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleModeChange = (newMode: Mode) => {
        if (newMode === mode) return;
        setIsTransitioning(true);
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
                    {mode === "login" && <LoginForm onSwitch={() => handleModeChange("register")} onForgot={() => handleModeChange("forgot")} />}
                </div>
                <div className={`${styles.content} ${mode === "forgot" && !isTransitioning ? styles.contentVisible : styles.contentHidden}`}>
                    {mode === "forgot" && <ForgotPasswordForm onSwitch={() => handleModeChange("login")} />}
                </div>
            </div>

            {/* Lado trasero → Register */}
            <div className={`${styles.cardFace} ${styles.cardBack}`}>
                <div className={`${styles.content} ${mode === "register" && !isTransitioning ? styles.contentVisible : styles.contentHidden}`}>
                    {mode === "register" && <RegisterForm onSwitch={() => handleModeChange("login")} />}
                </div>
            </div>
        </div>
    );
}
