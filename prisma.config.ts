// prisma.config.ts 

import { defineConfig, env } from 'prisma/config';
import 'dotenv/config';
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // URL is defined here in v7, NOT in schema.prisma
    url: env('DATABASE_URL'), 
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});