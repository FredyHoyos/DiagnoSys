"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/shadcn-charts/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, PlayCircle, CheckCircle, ZoomOut } from "lucide-react";

interface FormItem {
    id: number;
    name: string;
    isCompleted: boolean;
    completedAt: string | null;
}

interface ZoomData {
    reportId: number;
    reportName: string;
    version: number;
    forms: FormItem[];
}

export default function ZoomOutPage() {
    const router = useRouter();
    const params = useParams();
    const { status } = useSession();
    const [zoomData, setZoomData] = useState<ZoomData | null>(null);
    const [loading, setLoading] = useState(true);

    const reportId = params.reportId as string;

    useEffect(() => {
        if (status === "authenticated" && reportId) {
            fetchZoomData();
        }
    }, [status, reportId]);

    const fetchZoomData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/organization/reports/${reportId}/zoom-out`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch zoom-out data');
            }

            const data = await response.json();
            setZoomData(data.zoomData);
        } catch (error) {
            console.error('🚨 Error fetching zoom-out data:', error);
            router.push(`/dashboard/organization/report/${reportId}/menu`);
        } finally {
            setLoading(false);
        }
    };

    const startForm = (formId: number) => {
        router.push(`/dashboard/organization/report/${reportId}/zoom-out/forms/${formId}`);
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading zoom-out assessment...</span>
                </div>
            </div>
        );
    }

    if (!zoomData) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-500">Zoom-out data not found</p>
                        <Button 
                            className="mt-4" 
                            onClick={() => router.push(`/dashboard/organization/report/${reportId}/menu`)}
                        >
                            Back to Menu
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getFormStatusBadge = (form: FormItem) => {
        if (form.isCompleted) {
            return <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
        } else {
            return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Not Started</Badge>;
        }
    };

    const completedForms = zoomData.forms.filter(f => f.isCompleted).length;
    const totalForms = zoomData.forms.length;
    const completionRate = totalForms > 0 ? (completedForms / totalForms) * 100 : 0;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/organization/report/${reportId}/menu`)}
                    className="mb-4"
                    size="sm"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Menu
                </Button>
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                            <ZoomOut className="h-8 w-8 mr-3 text-purple-600" />
                            Zoom Out Assessment
                        </h1>
                        <p className="text-gray-600">
                            {zoomData.reportName} v{zoomData.version} - Strategic organizational maturity evaluation
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Progress</div>
                        <div className="text-2xl font-bold text-purple-600">
                            {Math.round(completionRate)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <Card className="mb-8">
                <CardContent className="py-6">
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div 
                            className="bg-purple-600 h-3 rounded-full transition-all duration-300" 
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>{completedForms} of {totalForms} forms completed</span>
                        <span>{totalForms - completedForms} remaining</span>
                    </div>
                </CardContent>
            </Card>

            {/* Forms Grid */}
            {zoomData.forms.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="text-gray-500 mb-4">
                            <ZoomOut className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium mb-2">No zoom-out forms available</h3>
                            <p>There are currently no strategic assessment forms available for this report</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {zoomData.forms.map((form) => (
                        <Card key={form.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg">{form.name}</CardTitle>
                                    {getFormStatusBadge(form)}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {form.completedAt && (
                                    <p className="text-sm text-gray-500 mb-4">
                                        Completed: {new Date(form.completedAt).toLocaleDateString()}
                                    </p>
                                )}
                                
                                <Button
                                    onClick={() => startForm(form.id)}
                                    className={`w-full ${
                                        form.isCompleted 
                                            ? 'bg-gray-600 hover:bg-gray-700' 
                                            : 'bg-purple-600 hover:bg-purple-700'
                                    } text-white`}
                                    disabled={form.isCompleted}
                                >
                                    {form.isCompleted ? (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            View Results
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle className="h-4 w-4 mr-2" />
                                            Start Assessment
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Navigation */}
            <div className="mt-8 text-center">
                <Button
                    onClick={() => router.push(`/dashboard/organization/report/${reportId}/menu`)}
                    variant="outline"
                >
                    Return to Report Menu
                </Button>
            </div>
        </div>
    );
}
