"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./register.module.css";

const schema = z
    .object({
        name: z.string().min(1, { message: "Name is required" }),
        email: z.string().email({ message: "Invalid email address" }),
        password: z
            .string()
            .min(8, { message: "Password must be at least 8 characters" }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [successPopup, setSuccessPopup] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    async function onSubmit(data: FormData) {

        setServerError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                }),
            });

            type RegisterResponse = { error?: string };
            const body: RegisterResponse = await res.json().catch(() => ({}));

            if (!res.ok) {
                setServerError(body.error || "Server error");
                return;
            }

            // Mostrar pop-up de éxito
            setSuccessPopup(true);

            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                router.push("/auth/login");
            }, 4000);
        } catch {
            setServerError("Could not connect to the server");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className={styles.form}
            >
                <div className={styles.header}>
                    <h2 className={styles.title}>Create Account</h2>
                    <p className={styles.subtitle}>Sign up to get started</p>
                </div>
                <div className={styles.inputGroup}>
                    <input
                        id="name"
                        {...register("name")}
                        placeholder=" "
                        className={styles.input}
                    />
                    <label htmlFor="name" className={styles.label}>
                        Name
                    </label>
                    {errors.name && <p className={styles.error}>{errors.name.message}</p>}
                </div>

                <div className={styles.inputGroup}>
                    <input
                        id="email"
                        {...register("email")}
                        placeholder=" "
                        className={styles.input}
                    />
                    <label htmlFor="email" className={styles.label}>
                        Email
                    </label>
                    {errors.email && (
                        <p className={styles.error}>{errors.email.message}</p>
                    )}
                </div>

                <div className={styles.inputGroup}>
                    <input
                        id="password"
                        type="password"
                        {...register("password")}
                        placeholder=" "
                        className={styles.input}
                    />
                    <label htmlFor="password" className={styles.label}>
                        Password
                    </label>
                    {errors.password && (
                        <p className={styles.error}>{errors.password.message}</p>
                    )}
                </div>

                <div className={styles.inputGroup}>
                    <input
                        id="confirmPassword"
                        type="password"
                        {...register("confirmPassword")}
                        placeholder=" "
                        className={styles.input}
                    />
                    <label htmlFor="confirmPassword" className={styles.label}>
                        Confirm Password
                    </label>
                    {errors.confirmPassword && (
                        <p className={styles.error}>{errors.confirmPassword.message}</p>
                    )}
                </div>

                {serverError && <p className={styles.serverError}>{serverError}</p>}

                <button type="submit" disabled={loading} className={styles.button}>
                    {loading ? "Creating account..." : "Create account"}
                </button>
            </form>

            {successPopup && (
                <div className={styles.popupOverlay}>
                    <div className={styles.popup}>
                        <h3>🎉 Account created successfully!</h3>
                        <p>You will be redirected to login shortly.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
