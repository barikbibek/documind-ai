import type { Request, Response, NextFunction } from "express";
import { sendError, sendSuccess } from "../../utils/apiResponse";
import { getMe, loginUser, registerUser } from "./auth.service";



export async function register(req: Request, res: Response){
    try {
        const result = await registerUser(req.body)
        sendSuccess(res, result, 201)
    } catch (err) {
        sendError(res, (err as Error).message, 400)
    }
}

export async function login(req: Request, res: Response){
    try {
        const result = await loginUser(req.body)
        sendSuccess(res, result)
    } catch (err) {
        sendError(res, (err as Error).message, 401)
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