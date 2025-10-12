// Helper function to check Prisma error codes safely
export function isPrismaError(error: unknown, code: string): boolean {
    return typeof error === 'object' && 
           error !== null && 
           'code' in error && 
           (error as { code: string }).code === code;
}

// Common Prisma error codes
export const PRISMA_ERRORS = {
    UNIQUE_CONSTRAINT: 'P2002',
    RECORD_NOT_FOUND: 'P2025',
    FOREIGN_KEY_CONSTRAINT: 'P2003',
} as const;
