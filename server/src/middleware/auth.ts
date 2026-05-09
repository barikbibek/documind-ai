import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"
import { env } from "../config/env";
import type { JwtPayload } from "../types";

export function authMiddleware(req: Request, res: Response, next: NextFunction){
    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
    }
    const token = authHeader.split(" ")[1]

    try {
        const payload = jwt.verify(token, env.JWT_SECRET!) as JwtPayload
        req.user = payload
        next()
    } catch {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}