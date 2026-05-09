import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../utils/apiResponse";
import { createSession, deleteSession, getSessionById, getUserSessions, updateSession } from "./sessions.service";


export async function create(req: Request, res: Response){
    try {
        const session = await createSession(req.user!.userId, req.body)
        sendSuccess(res, session, 201)
    } catch (err) {
        sendError(res, (err as Error).message, 400)
    }
}

export async function list(req: Request, res: Response){
    try {
        const sessions = await getUserSessions(req.user!.userId)
        sendSuccess(res, sessions)
    } catch (err) {
        sendError(res, (err as Error).message)
    }
}

export async function getOne(req: Request, res: Response){
    try {
        const session = await getSessionById((req.params.id as any), req.user!.userId)
        sendSuccess(res, session)
    } catch (err) {
        sendError(res, (err as Error).message, 404)
    }
}

export async function update(req: Request, res: Response) {
  try {
    const session = await updateSession((req.params.id as any), req.user!.userId, req.body);
    sendSuccess(res, session);
  } catch (err) {
    sendError(res, (err as Error).message, 400);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await deleteSession((req.params.id as any), req.user!.userId);
    sendSuccess(res, { message: 'Session deleted' });
  } catch (err) {
    sendError(res, (err as Error).message, 404);
  }
}