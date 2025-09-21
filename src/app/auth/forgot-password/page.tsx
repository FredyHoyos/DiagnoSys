"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "./forgot-password.module.css";

// Validation schema
const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage({ onBack }: { onBack: () => void }) {
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // React Hook Form with Zod
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    async function onSubmit(data: ForgotPasswordForm) {
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const response = await res.json();

            if (res.ok) {
                setMessage("If this email exists, we sent you reset instructions ✉️");
            } else {
                setError(response.error || "Something went wrong");
            }
        } catch {
            setError("Error sending reset link, please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <h2 className={styles.title}>Forgot Password?</h2>
                <p className={styles.subtitle}>
                    Enter your email and we’ll send you a reset link
                </p>

                {/* Floating label input */}
                <div className={styles.inputGroup}>
                    <input
                        id="email"
                        type="email"
                        placeholder=" "
                        className={styles.input}
                        aria-invalid={!!errors.email}
                        {...register("email")}
                    />
                    <label htmlFor="email" className={styles.label}>
                        Email
                    </label>
                    {errors.email && (
                        <p className={styles.error}>{errors.email.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={styles.button}
                    aria-busy={loading}
                >
                    {loading ? "Sending..." : "Send Reset Link"}
                </button>

                {error && <p className={styles.error}>{error}</p>}
                {message && <p className={styles.success}>{message}</p>}

                <p className={styles.footer}>
                    Remembered?{" "}
                    <button
                        type="button"
                        onClick={onBack}
                        className={styles.link}
                        aria-label="Back to login"
                    >
                        Back to login
                    </button>
                </p>
            </form>
        </div>
    );
}
