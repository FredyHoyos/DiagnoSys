'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./preview-forms.module.css";
import { FileText } from "lucide-react";

interface Category {
    id: string;
    name: string;
    items: Item[];
}

interface Item {
    id: string;
    name: string;
}

interface Module {
    id: number;
    name: string;
    description: string;
}

interface Form {
    id: string;
    name: string;
    description: string;
    tag: string | null;
    categories: Category[];
}

interface FormCardProps {
    id: string;
    title: string;
    description: string;
    categories: number;
    items: number;
    tag: string;
}

interface PreviewFormsProps {
    moduleName?: string;
    moduleId?: number;
}

export default function PreviewForms({ moduleName, moduleId }: PreviewFormsProps) {
    const [forms, setForms] = useState<FormCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchForms = async () => {
            try {
                setLoading(true);
                let moduleToUse: Module | null = null;

                if (moduleId) {
                    const response = await fetch(`/api/modules/${moduleId}`);
                    if (!response.ok) throw new Error("Failed to fetch module by ID");
                    const moduleData = await response.json();
                    moduleToUse = moduleData.module;
                } else if (moduleName) {
                    const modulesResponse = await fetch("/api/modules");
                    if (!modulesResponse.ok) throw new Error("Failed to fetch modules");

                    const modulesData = await modulesResponse.json();
                    moduleToUse = modulesData.modules.find(
                        (m: Module) => m.name === moduleName
                    );

                    if (!moduleToUse)
                        throw new Error(`Module "${moduleName}" not found`);
                } else {
                    throw new Error("No module name or ID provided");
                }

                if (!moduleToUse) throw new Error("Module not found");

                const response = await fetch(`/api/modules/${moduleToUse.id}/forms`);
                if (!response.ok) throw new Error("Failed to fetch forms");

                const formsData = await response.json();
                const data: Form[] = formsData.forms || [];

                const transformedForms: FormCardProps[] = data.map((form) => {
                    const totalItems = form.categories.reduce(
                        (sum, category) => sum + category.items.length,
                        0
                    );
                    return {
                        id: form.id,
                        title: form.name,
                        description: form.description,
                        categories: form.categories.length,
                        items: totalItems,
                        tag: form.tag || "General",
                    };
                });

                setForms(transformedForms);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchForms();
    }, [moduleName, moduleId]);

    const handleStartEvaluation = (formId: string) => {
        // Determinar la ruta basándose en el módulo y el contexto actual
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/admin/')) {
            // Para admin, redirigir al preview del formulario base
            if (moduleName === 'Zoom In') {
                router.push(`/dashboard/admin/zoom-in/forms/${formId}`);
            } else if (moduleName === 'Zoom Out') {
                router.push(`/dashboard/admin/zoom-out/forms/${formId}`);
            } else {
                router.push(`/dashboard/admin/forms/${formId}`);
            }
        } else if (currentPath.includes('/consultant/')) {
            // Para consultant, usar las rutas de consultor
            if (moduleName === 'Zoom In') {
                router.push(`/dashboard/consultant/zoom-in/forms/${formId}`);
            } else if (moduleName === 'Zoom Out') {
                router.push(`/dashboard/consultant/zoom-out/forms/${formId}`);
            } else {
                router.push(`/dashboard/consultant/forms/${formId}`);
            }
        } else {
            // Para organization, usar las rutas de organización
            if (moduleName === 'Zoom In') {
                router.push(`/dashboard/organization/zoom-in/forms/${formId}`);
            } else if (moduleName === 'Zoom Out') {
                router.push(`/dashboard/organization/zoom-out/forms/${formId}`);
            } else {
                router.push(`/dashboard/organization/forms/${formId}`);
            }
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <h2 className={styles.title}>Evaluation Forms</h2>
                <p className={styles.subtitle}>
                    Loading forms, please wait...
                </p>
                <div className={styles.grid}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`${styles.card} ${styles.skeletonCard}`}>
                            <div className={styles.skeletonHeaderRow}>
                                <div className={styles.skeletonHeaderLeft}></div>
                                <div className={styles.skeletonTag}></div> {/* <-- skeleton del tag */}
                            </div>

                            <div className={styles.skeletonLine}></div>
                            <div className={styles.skeletonLine}></div>
                            <div className={styles.skeletonMeta}></div>
                            <div className={styles.skeletonButton}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <p>Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Evaluation Forms</h2>
            <p className={styles.subtitle}>
                Complete the forms to evaluate different organizational aspects
            </p>

            <div className={styles.grid}>
                {forms.map((form) => (
                    <div key={form.id} className={styles.card}>
                        <div className={styles.cardContent}>
                            <div className={styles.header}>
                                <div className={styles.headerLeft}>
                                    <FileText className={styles.icon} />
                                    <h3 className={styles.titleCard}>{form.title}</h3>
                                </div>
                                <span className={styles.tag}>{form.tag}</span>
                            </div>
                            <p className={styles.description}>{form.description}</p>
                        </div>

                        <p className={styles.meta}>
                            {form.categories} categories • {form.items} items
                        </p>

                        <button
                            className={styles.button}
                            onClick={() => handleStartEvaluation(form.id)}
                        >
                            Start Evaluation
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
