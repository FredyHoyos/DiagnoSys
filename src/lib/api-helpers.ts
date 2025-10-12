/**
 * Helper functions for API error handling
 */

interface PrismaError {
    code?: string;
    message?: string;
}

export function isPrismaError(error: unknown): error is PrismaError {
    return typeof error === 'object' && error !== null && 'code' in error;
}

export function handlePrismaError(error: unknown): { message: string; status: number } {
    if (!isPrismaError(error)) {
        return { message: "Internal server error", status: 500 };
    }

    switch (error.code) {
        case 'P2002':
            return { message: "Record already exists", status: 409 };
        case 'P2025':
            return { message: "Record not found", status: 404 };
        case 'P2003':
            return { message: "Foreign key constraint failed", status: 400 };
        case 'P2014':
            return { message: "Invalid ID provided", status: 400 };
        default:
            return { message: "Database error", status: 500 };
    }
}

export function calculateAverageScore(scores: (number | null)[]): number | null {
    const validScores = scores.filter((score): score is number => score !== null && typeof score === 'number');
    
    if (validScores.length === 0) {
        return null;
    }
    
    const sum = validScores.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / validScores.length) * 100) / 100;
}

export interface RoleDistribution {
    [roleName: string]: {
        total: number;
        scored: number;
    };
}
