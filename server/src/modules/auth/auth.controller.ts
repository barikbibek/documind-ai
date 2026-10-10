import type { Request, Response, NextFunction } from "express";
import { sendError, sendSuccess } from "../../utils/apiResponse";
import { getMe, loginUser, registerUser } from "./auth.service";
import { logger } from '../../utils/logger';



export async function register(req: Request, res: Response){
    try {
        const result = await registerUser(req.body)
        sendSuccess(res, result, 201)
    } catch (err) {
        if ((err as Error).message === 'Email already in use' || (err as { code?: string }).code === '23505') return sendError(res, 'Email already in use', 409)
        logger.error(err)
        sendError(res, 'Could not create account', 500)
    }
}

export async function login(req: Request, res: Response){
    try {
        const result = await loginUser(req.body)
        sendSuccess(res, result)
    } catch (err) {
        if ((err as Error).message !== 'Invalid credentials') logger.error(err)
        sendError(res, 'Invalid credentials', 401)
    }
}

export async function me(req: Request, res: Response) {
    try {
        const user = await getMe(req.user!.userId)
        sendSuccess(res, user)
    } catch (err) {
        sendError(res, (err as Error).message, 404)
    }
}
