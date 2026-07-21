import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(__dirname, '..');
const envPath = resolve(projectDir, '.env');

const envContent = readFileSync(envPath, 'utf-8');
const match = envContent.match(/^#?\s*DATABASE_URL=(.+)$/m);

if (!match) {
    console.error('ERROR: DATABASE_URL not found in .env');
    process.exit(1);
}

const dbUrl = match[1].trim();
console.log(`Pushing schema to production Neon database...`);
console.log(`URL: ${dbUrl.slice(0, 40)}...`);
console.log('');

execSync('npx drizzle-kit push --config drizzle.config.pg.ts', {
    cwd: projectDir,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
});
