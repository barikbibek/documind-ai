import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";


export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction){
    logger.error(error)
    res.status(500).json({ success: false, message: error.message || 'Internal server error' })
}