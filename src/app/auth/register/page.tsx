"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import styles from "./register.module.css";

const schema = z
    .object({
        name: z.string().min(1, { message: "Name is required" }),
        email: z.string().email({ message: "Invalid email address" }),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[0-9]/, "Must contain at least one number"),
            confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });

type FormData = z.infer<typeof schema>;

export default function RegisterPage({ onSwitch }: { onSwitch: () => void }) {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [successPopup, setSuccessPopup] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });


    async function onSubmit(data: FormData) {
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
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
                setError(body.error || "Server error");
                return;
            }

            setSuccessPopup(true);

            setTimeout(() => {
                setSuccessPopup(false);
                reset(undefined, { keepErrors: false, keepDirty: false, keepTouched: false });  // Limpiar el formulario
                onSwitch(); // Cambiar a la vista de login
            }, 3000);
        } catch {
            setError("Could not connect to the server");
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
                    <h2 className={styles.title}>Get started</h2>
                    <p className={styles.subtitle}>Create a new account</p>
                </div>

                {/* Name */}
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

                {/* Email */}
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
                    {errors.email && <p className={styles.error}>{errors.email.message}</p>}
                </div>

                {/* Password */}
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
                    {errors.password && <p className={styles.error}>{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
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

                {error && <p className={styles.serverError}>{error}</p>}

                {/* Submit Button */}
                <button type="submit" disabled={loading} className={styles.button}>
                    {loading ? "Creating account..." : "Create account"}
                </button>

                {/* Aquí agregamos la parte nueva */}
                <p className={styles.footerText}>
                    Have an account?{" "}
                    <button type="button" onClick={() => {
                        reset(undefined, { keepErrors: false });
                        onSwitch();
                    }} className={styles.link}>
                        Sign In Now
                    </button>
                </p>
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
