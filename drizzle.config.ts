import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/lib/server/db/schema_sqlite.ts',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: 'local.db',
    },
});
