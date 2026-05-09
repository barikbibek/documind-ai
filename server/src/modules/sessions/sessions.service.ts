import { eq, and } from "drizzle-orm"
import { db } from "../../config/db"
import { chatSessions, documents } from "../../db/schema"
import type { CreateSessionInput, UpdateSessionInput } from "./sessions.schema"

export async function createSession(userId: string, input: CreateSessionInput){
    const [session] = await db.insert(chatSessions).values({
        userId,
        title: input.title,
    }).returning()

    return session;
}

export async function getUserSessions(userId: string){
    return await db.select().from(chatSessions).where(eq(chatSessions.userId, userId))
}

export async function getSessionById(sessionId: string, userId: string){
    const [session] = await db.select().from(chatSessions).where(and(
        eq(chatSessions.id, sessionId),
        eq(chatSessions.userId, userId)
    ))

    if(!session) throw new Error("Session not found")

    const docs = await db.select().from(documents).where(eq(documents.sessionId, sessionId))

    return {...session, documents: docs }
}


export async function updateSession(sessionId: string, userId: string, input: UpdateSessionInput){
    const [updated] = await db.update(chatSessions).set(
        { title: input.title, updatedAt: new Date() }
    ).where(
        and(
            eq(chatSessions.id, sessionId),
            eq(chatSessions.userId, userId)
        )
    ).returning()

    if(!updated) throw new Error("Session not Found")
    return updated
}

export async function deleteSession(sessionId: string, userId: string){
    const [deleted] = await db.delete(chatSessions).where(
        and(
            eq(chatSessions.id, sessionId),
            eq(chatSessions.userId, userId)
        )
    ).returning()

    if(!deleted) throw new Error("Session not found")
    return deleted
}