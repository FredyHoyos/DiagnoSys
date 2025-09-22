"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "./reset-password.module.css";

// Validación de nueva contraseña
const resetSchema = z
    .object({
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[0-9]/, "Must contain at least one number"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
    const router = useRouter();
    // ya no usamos useSearchParams
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // leer token desde window.location.search (solo en cliente)
    useEffect(() => {
        if (typeof window === "undefined") return;
        const q = new URLSearchParams(window.location.search).get("token");
        setToken(q);
    }, []); // vacio: solo al montar en cliente

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetForm>({
        resolver: zodResolver(resetSchema),
    });

    async function onSubmit(data: ResetForm) {
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: data.password }),
            });

            const response = await res.json();
            if (res.ok) {
                setMessage("Password reset successfully! Redirecting to login...");
                setTimeout(() => router.push("/auth/card"), 3000);
            } else {
                setError(response.error || "Something went wrong");
            }
        } catch {
            setError("Error resetting password. Try again.");
        } finally {
            setLoading(false);
        }
    }

    // Mientras aún no tenemos token (render del cliente)
    if (token === null) {
        return <p className={styles.error}>Loading...</p>;
    }

    // Token inválido o ausente
    if (!token) {
        return <p className={styles.error}>Invalid reset link</p>;
    }

    // Token válido
    return (
        <div className={styles.container}>
            {/* Overlay que bloquea clicks durante redirección exitosa */}
            {message && (
                <div className={styles.overlay}></div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <h2 className={styles.title}>Reset Password</h2>
                <p className={styles.subtitle}>Enter your new password below</p>

                <div className={styles.inputGroup}>
                    <input
                        id="password"
                        type="password"
                        placeholder=" "
                        className={styles.input}
                        {...register("password")}
                        disabled={loading || !!message} // Deshabilitar si hay mensaje de éxito
                    />
                    <label htmlFor="password" className={styles.label}>
                        New Password
                    </label>
                    {errors.password && (
                        <p className={styles.error}>{errors.password.message}</p>
                    )}
                </div>

                <div className={styles.inputGroup}>
                    <input
                        id="confirmPassword"
                        type="password"
                        placeholder=" "
                        className={styles.input}
                        {...register("confirmPassword")}
                        disabled={loading || !!message} // Deshabilitar si hay mensaje de éxito
                    />
                    <label htmlFor="confirmPassword" className={styles.label}>
                        Confirm Password
                    </label>
                    {errors.confirmPassword && (
                        <p className={styles.error}>{errors.confirmPassword.message}</p>
                    )}
                </div>

                <button 
                    type="submit" 
                    className={styles.button} 
                    disabled={loading || !!message} // Deshabilitar si hay mensaje de éxito
                >
                    {loading ? "Resetting..." : "Reset Password"}
                </button>

                {error && <p className={styles.error}>{error}</p>}
                {message && <p className={styles.success}>{message}</p>}
            </form>
        </div>
    );
}
