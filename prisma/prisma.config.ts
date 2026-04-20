import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

export default defineConfig({
    datasource: {
        url: databaseUrl,
    },
    migrations: {
        seed: "tsx prisma/seed.ts",
    },
});
