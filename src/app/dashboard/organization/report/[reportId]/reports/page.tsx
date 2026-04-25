"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, BarChart3, Radar, Layers3, ListFilter, ListChecks, Sparkles } from "lucide-react";
import { FormRadarChart } from "@/app/components/shadcn-charts/radar-chart/form-radar-chart";
import { Card, CardContent, CardHeader } from "@/app/components/shadcn-charts/card";
import { Button } from "@/components/ui/button";

interface CategoryData {
    name: string;
    score: number;
    maxScore: number;
    itemCount: number;
    totalScore: number;
}

interface FormData {
    id: number;
    name: string;
    module: string;
    isCompleted: boolean;
    completedAt: string | null;
    categoryData: CategoryData[];
    stats: {
        totalItems: number;
        totalScore: number;
        avgScore: number;
        maxPossibleScore: number;
        completionPercentage: number;
    };
}

interface ApiResponse {
    zoomInForms: FormData[];
    zoomOutForms: FormData[];
    categorizationSummary: {
        hasData: boolean;
        savedAt: string | null;
        opportunities: { name: string }[];
        needs: { name: string }[];
        problems: { name: string }[];
        totalItems: number;
    };
    prioritizationSummary: {
        hasData: boolean;
        savedAt: string | null;
        highPriority: { name: string }[];
        mediumPriority: { name: string }[];
        lowPriority: { name: string }[];
        mediumPriority2: { name: string }[];
        totalItems: number;
    };
    message: string;
}

type ContentView = "charts" | "categorization" | "prioritization";
type ChartFilter = "all" | "zoom-in" | "zoom-out";

export default function ReportsPage() {
    const router = useRouter();
    const { status } = useSession();
    const searchParams = useSearchParams();
    const params = useParams<{ reportId?: string; reportid?: string }>();
    const reportId = params?.reportId ?? params?.reportid;
    const organizationId = searchParams.get("organizationId");
    const organizationName = searchParams.get("organizationName");
    const consultantScopedMode = Boolean(organizationId);
    const contextQuery = consultantScopedMode
        ? `&organizationId=${organizationId}&organizationName=${encodeURIComponent(organizationName ?? "")}`
        : "";
    const [loading, setLoading] = useState(true);
    const [zoomInForms, setZoomInForms] = useState<FormData[]>([]);
    const [zoomOutForms, setZoomOutForms] = useState<FormData[]>([]);
    const [activeView, setActiveView] = useState<ContentView>("charts");
    const [chartFilter, setChartFilter] = useState<ChartFilter>("all");
    const [categorizationSummary, setCategorizationSummary] = useState<ApiResponse["categorizationSummary"]>({
        hasData: false,
        savedAt: null,
        opportunities: [],
        needs: [],
        problems: [],
        totalItems: 0,
    });
    const [prioritizationSummary, setPrioritizationSummary] = useState<ApiResponse["prioritizationSummary"]>({
        hasData: false,
        savedAt: null,
        highPriority: [],
        mediumPriority: [],
        lowPriority: [],
        mediumPriority2: [],
        totalItems: 0,
    });

    const formatSavedAt = (date: string | null) => {
        if (!date) return "Sin fecha";
        return new Date(date).toLocaleString("es-CO", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    useEffect(() => {
        const fetchPersonalizedForms = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/organization/reports/radar-data?reportId=${reportId}${contextQuery}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch personalized forms');
                }

                const data: ApiResponse = await response.json();
                setZoomInForms(data.zoomInForms || []);
                setZoomOutForms(data.zoomOutForms || []);
                setCategorizationSummary(data.categorizationSummary);
                setPrioritizationSummary(data.prioritizationSummary);
            } catch (error) {
                console.error('🚨 Error fetching personalized forms:', error);
            } finally {
                setLoading(false);
            }
        };

        if (status === "loading") return;

        if (status !== "authenticated" || !reportId) {
            setLoading(false);
            return;
        }

        fetchPersonalizedForms();
    }, [status, reportId, contextQuery]);

    if (status === "loading" || loading) {
        return (
            <div className="w-full">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 h-9 w-80 bg-gray-200 rounded animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
                        ))}
                    </div>
                    <div className="h-14 rounded-xl bg-gray-100 animate-pulse mb-8" />
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-96 rounded-xl bg-gray-100 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const hasAnyChartData = zoomInForms.length > 0 || zoomOutForms.length > 0;
    const showZoomInCharts = chartFilter !== "zoom-out";
    const showZoomOutCharts = chartFilter !== "zoom-in";
    const totalFormularios =
        zoomInForms.length +
        zoomOutForms.length +
        (categorizationSummary.hasData ? 1 : 0) +
        (prioritizationSummary.hasData ? 1 : 0);

    const SummaryColumn = ({
        title,
        items,
        emptyLabel,
        titleClass,
        chipClass,
    }: {
        title: string;
        items: { name: string }[];
        emptyLabel: string;
        titleClass: string;
        chipClass: string;
    }) => (
        <div className="rounded-xl border border-green-100 bg-white/70 p-4">
            <h3 className={`mb-3 text-sm font-semibold ${titleClass}`}>{title}</h3>
            {items.length === 0 ? (
                <p className="text-sm text-gray-500">{emptyLabel}</p>
            ) : (
                <div className="max-h-64 space-y-2 overflow-auto pr-1">
                    {items.map((item, index) => (
                        <div key={`${item.name}-${index}`} className={`rounded-lg px-3 py-2 text-sm ${chipClass}`}>
                            {item.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {consultantScopedMode && (
                    <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3">
                        <p className="text-sm text-blue-900">
                            Estás visualizando reportes de {organizationName || `Organización #${organizationId}`} en modo consultor.
                        </p>
                        <button
                            type="button"
                            className="mt-2 text-sm text-blue-700 hover:underline cursor-pointer"
                            onClick={() => router.push("/dashboard/consultant/organizations")}
                        >
                            Volver a mi perfil de consultor
                        </button>
                    </div>
                )}
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#2E6347] mb-2">
                        Reportes de Evaluación Digital
                    </h1>
                    <p className="text-black">
                        Visualiza gráficas de radar y resúmenes ejecutivos de categorización y priorización
                    </p>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ">
                    <Card className="green">
                        <CardContent className="pt-6 ">
                            <div className="flex items-center space-x-8">
                                <BarChart3 className="h-9 w-9 text-emerald-800" />
                                <div>
                                    <p className="text-2xl font-medium text-[#2E6347]">Formularios Zoom In</p>
                                    <p className="text-2xl font-bold">{zoomInForms.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="green">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-8">
                                <BarChart3 className="h-9 w-9 text-emerald-800" />
                                <div>
                                    <p className="text-2xl font-medium text-[#2E6347]">Formularios Zoom Out</p>
                                    <p className="text-2xl font-bold">{zoomOutForms.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="green">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-8">
                                <TrendingUp className="h-9 w-9 text-blue-500" />
                                <div>
                                    <p className="text-2xl font-medium text-[#2E6347]">Total Formularios</p>
                                    <p className="text-2xl font-bold">
                                        {totalFormularios}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="green-interactive mb-8 border border-emerald-200">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-2 text-[#2E6347] font-semibold">
                                <Layers3 className="h-5 w-5" />
                                Cambiar vista de resultados
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant={activeView === "charts" ? "default" : "outline"}
                                    className={activeView === "charts" ? "bg-[#2E6347] text-white" : ""}
                                    onClick={() => setActiveView("charts")}
                                >
                                    <Radar className="h-4 w-4 mr-2" />
                                    Gráficas
                                </Button>
                                <Button
                                    size="sm"
                                    variant={activeView === "categorization" ? "default" : "outline"}
                                    className={activeView === "categorization" ? "bg-[#2E6347] text-white" : ""}
                                    onClick={() => setActiveView("categorization")}
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Categorización
                                </Button>
                                <Button
                                    size="sm"
                                    variant={activeView === "prioritization" ? "default" : "outline"}
                                    className={activeView === "prioritization" ? "bg-[#2E6347] text-white" : ""}
                                    onClick={() => setActiveView("prioritization")}
                                >
                                    <ListChecks className="h-4 w-4 mr-2" />
                                    Priorización
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {activeView === "charts" && (
                    <div className="green-interactive mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-emerald-100 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <ListFilter className="h-4 w-4" />
                            Filtrar radar por módulo
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant={chartFilter === "all" ? "default" : "outline"}
                                className={chartFilter === "all" ? "bg-[#2E6347] text-white" : ""}
                                onClick={() => setChartFilter("all")}
                            >
                                Zoom In + Zoom Out
                            </Button>
                            <Button
                                size="sm"
                                variant={chartFilter === "zoom-in" ? "default" : "outline"}
                                className={chartFilter === "zoom-in" ? "bg-[#2E6347] text-white" : ""}
                                onClick={() => setChartFilter("zoom-in")}
                            >
                                Solo Zoom In
                            </Button>
                            <Button
                                size="sm"
                                variant={chartFilter === "zoom-out" ? "default" : "outline"}
                                className={chartFilter === "zoom-out" ? "bg-[#2E6347] text-white" : ""}
                                onClick={() => setChartFilter("zoom-out")}
                            >
                                Solo Zoom Out
                            </Button>
                        </div>
                    </div>
                )}

                {activeView === "charts" && (
                    <>
                        {showZoomInCharts && zoomInForms.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-[#2E6347] mb-6 flex items-center">
                                    <Radar className="h-6 w-6 mr-2 text-[#2E6347]" />
                                    Zoom In - Evaluación de Habilidades
                                </h2>
                                <div className="flex flex-col gap-6">
                                    {zoomInForms.map((form) => (
                                        <div key={form.id} className="min-h-[400px] flex">
                                            <FormRadarChart
                                                title={form.name}
                                                description={`Módulo: ${form.module} | Puntaje Prom: ${form.stats.avgScore}/5.0`}
                                                data={form.categoryData}
                                                className="w-full"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showZoomOutCharts && zoomOutForms.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-[#2E6347] mb-6 flex items-center">
                                    <Radar className="h-6 w-6 mr-2 text-[#2E6347]" />
                                    Zoom Out - Evaluación de Capacidades
                                </h2>
                                <div className="flex flex-col gap-6">
                                    {zoomOutForms.map((form) => (
                                        <div key={form.id} className="min-h-[400px] flex">
                                            <FormRadarChart
                                                title={form.name}
                                                description={`Módulo: ${form.module} | Puntaje Prom: ${form.stats.avgScore}/5.0`}
                                                data={form.categoryData}
                                                className="w-full"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(!hasAnyChartData ||
                            (chartFilter === "zoom-in" && zoomInForms.length === 0) ||
                            (chartFilter === "zoom-out" && zoomOutForms.length === 0)) && (
                            <Card className="green-interactive">
                                <CardContent className="py-12 text-center">
                                    <div className="text-[#2E6347]">
                                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50 text-[#2E6347]" />
                                        <h3 className="text-lg font-medium mb-2">Sin gráficas para este filtro</h3>
                                        <p>Prueba con otro filtro o completa más formularios para generar resultados.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {activeView === "categorization" && (
                    <Card className="green-interactive border border-emerald-100">
                        <CardHeader>
                            <div className="flex flex-col gap-1">
                                <h2 className="text-2xl font-bold text-[#2E6347] flex items-center gap-2">
                                    <Sparkles className="h-6 w-6" />
                                    Resumen de Categorización
                                </h2>
                                <p className="text-sm text-gray-700">
                                    Última actualización: {formatSavedAt(categorizationSummary.savedAt)}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                                    <p className="text-sm text-emerald-800">Oportunidades</p>
                                    <p className="text-2xl font-bold text-emerald-900">{categorizationSummary.opportunities.length}</p>
                                </div>
                                <div className="rounded-xl bg-sky-50 p-4 border border-sky-100">
                                    <p className="text-sm text-sky-800">Necesidades</p>
                                    <p className="text-2xl font-bold text-sky-900">{categorizationSummary.needs.length}</p>
                                </div>
                                <div className="rounded-xl bg-rose-50 p-4 border border-rose-100">
                                    <p className="text-sm text-rose-800">Problemas</p>
                                    <p className="text-2xl font-bold text-rose-900">{categorizationSummary.problems.length}</p>
                                </div>
                            </div>

                            {!categorizationSummary.hasData ? (
                                <p className="text-sm text-gray-600">Aún no hay una sesión de categorización guardada para este reporte.</p>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <SummaryColumn
                                        title="Oportunidades"
                                        items={categorizationSummary.opportunities}
                                        emptyLabel="Sin oportunidades registradas"
                                        titleClass="text-emerald-900"
                                        chipClass="bg-emerald-100 text-emerald-900"
                                    />
                                    <SummaryColumn
                                        title="Necesidades"
                                        items={categorizationSummary.needs}
                                        emptyLabel="Sin necesidades registradas"
                                        titleClass="text-sky-900"
                                        chipClass="bg-sky-100 text-sky-900"
                                    />
                                    <SummaryColumn
                                        title="Problemas"
                                        items={categorizationSummary.problems}
                                        emptyLabel="Sin problemas registrados"
                                        titleClass="text-rose-900"
                                        chipClass="bg-rose-100 text-rose-900"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeView === "prioritization" && (
                    <Card className="green-interactive border border-emerald-100">
                        <CardHeader>
                            <div className="flex flex-col gap-1">
                                <h2 className="text-2xl font-bold text-[#2E6347] flex items-center gap-2">
                                    <ListChecks className="h-6 w-6" />
                                    Resumen de Priorización
                                </h2>
                                <p className="text-sm text-gray-700">
                                    Última actualización: {formatSavedAt(prioritizationSummary.savedAt)}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="rounded-xl bg-red-50 p-4 border border-red-100">
                                    <p className="text-sm text-red-800">Alta</p>
                                    <p className="text-2xl font-bold text-red-900">{prioritizationSummary.highPriority.length}</p>
                                </div>
                                <div className="rounded-xl bg-amber-50 p-4 border border-amber-100">
                                    <p className="text-sm text-amber-800">Media 1</p>
                                    <p className="text-2xl font-bold text-amber-900">{prioritizationSummary.mediumPriority.length}</p>
                                </div>
                                <div className="rounded-xl bg-lime-50 p-4 border border-lime-100">
                                    <p className="text-sm text-lime-800">Baja</p>
                                    <p className="text-2xl font-bold text-lime-900">{prioritizationSummary.lowPriority.length}</p>
                                </div>
                                <div className="rounded-xl bg-orange-50 p-4 border border-orange-100">
                                    <p className="text-sm text-orange-800">Media 2</p>
                                    <p className="text-2xl font-bold text-orange-900">{prioritizationSummary.mediumPriority2.length}</p>
                                </div>
                            </div>

                            {!prioritizationSummary.hasData ? (
                                <p className="text-sm text-gray-600">Aún no hay una sesión de priorización guardada para este reporte.</p>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <SummaryColumn
                                        title="Alta prioridad"
                                        items={prioritizationSummary.highPriority}
                                        emptyLabel="Sin elementos"
                                        titleClass="text-red-900"
                                        chipClass="bg-red-100 text-red-900"
                                    />
                                    <SummaryColumn
                                        title="Media prioridad 1"
                                        items={prioritizationSummary.mediumPriority}
                                        emptyLabel="Sin elementos"
                                        titleClass="text-amber-900"
                                        chipClass="bg-amber-100 text-amber-900"
                                    />
                                    <SummaryColumn
                                        title="Baja prioridad"
                                        items={prioritizationSummary.lowPriority}
                                        emptyLabel="Sin elementos"
                                        titleClass="text-lime-900"
                                        chipClass="bg-lime-100 text-lime-900"
                                    />
                                    <SummaryColumn
                                        title="Media prioridad 2"
                                        items={prioritizationSummary.mediumPriority2}
                                        emptyLabel="Sin elementos"
                                        titleClass="text-orange-900"
                                        chipClass="bg-orange-100 text-orange-900"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
