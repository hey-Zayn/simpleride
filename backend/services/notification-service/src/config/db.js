import dotenv from 'dotenv';
dotenv.config();

import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pgPkg from 'pg';

const { PrismaClient } = pkg;
const { Pool } = pgPkg;

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing in environment variables!');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;