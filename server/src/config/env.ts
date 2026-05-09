import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
    PORT: z.string().default("4000"),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    JWT_SECRET: z.string().min(6),
    JWT_EXPIRES_IN: z.string().default('7d'),
    OPENAI_API_KEY: z.string().startsWith('sk-'),
    OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
    OPENAI_CHAT_MODEL: z.string().default('gpt-4o-mini'),
    UPLOAD_DIR: z.string().default('./uploads'),
    MAX_FILE_SIZE_MB: z.string().default('50'),
})

export const env = envSchema.parse(process.env)