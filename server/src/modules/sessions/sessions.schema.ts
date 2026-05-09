import { title } from "node:process"
import { z } from "zod"

export const createSessionSchema = z.object({
    title: z.string().min(1).default('New Chat')
})

export const updateSessionSchema = z.object({
    title: z.string().min(1)
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>