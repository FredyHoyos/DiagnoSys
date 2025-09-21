"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "./login.module.css";

// esquema de validación con zod
const schema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[0-9]/, "Must contain at least one number"),
    rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;


export default function LoginPage({ onSwitch, onForgot }: { onSwitch: () => void; onForgot: () => void }) {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    async function onSubmit(data: FormData) {
        setError("");
        setLoading(true);

        const res = await signIn("credentials", {
            redirect: false,
            email: data.email,
            password: data.password,
            rememberMe: data.rememberMe, // para gestionar sesión persistente
        });

        setLoading(false);

        if (res?.error) {
            setError("Invalid email or password");
        } else {
            router.push("/dashboard"); // redirigir a dashboard
            router.refresh(); // refrescar datos de sesión
        }
    }

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Welcome Back</h2>
                    <p className={styles.subtitle}>Sign in to your account</p>
                </div>

                {/* Email */}
                <div className={styles.inputGroup}>
                    <input
                        id="email"
                        type="email"
                        placeholder=" "
                        {...register("email")}
                        className={styles.input}
                    />
                    <label htmlFor="email" className={styles.label}>
                        Email
                    </label>
                    {errors.email && <p className={styles.error}>{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className={styles.inputGroup}>
                    <input
                        id="password"
                        type="password"
                        placeholder=" "
                        {...register("password")}
                        className={styles.input}
                    />
                    <label htmlFor="password" className={styles.label}>
                        Password
                    </label>
                    {errors.password && <p className={styles.error}>{errors.password.message}</p>}
                </div>

                {/* Remember me + Forgot password */}
                <div className={styles.optionsRow}>
                    <label className={styles.rememberMe}>
                        <input type="checkbox" {...register("rememberMe")} />
                        Remember me
                    </label>
                    <button type="button" onClick={onForgot} className={styles.link}>
                        Forgot your password?
                    </button>
                </div>

                {/* Error global */}
                {error && <p className={styles.error}>{error}</p>}

                {/* Botón */}
                <button type="submit" disabled={loading} className={styles.button}>
                    {loading ? "Logging in..." : "Login"}
                </button>

                {/* Register link */}
                <p className={styles.footerText}>
                    Don’t have an account?{" "}
                    <button type="button" onClick={onSwitch} className={styles.link}>
                        Sign Up Now
                    </button>
                </p>
            </form>
        </div>
    );
}
