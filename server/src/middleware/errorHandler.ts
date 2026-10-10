import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import multer from 'multer';


export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction){
    logger.error(error)
    if (error instanceof multer.MulterError) {
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        res.status(status).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'PDF is too large' : 'Upload limit exceeded' });
        return;
    }
    if (error.message === 'Only PDF files are allowed') {
        res.status(400).json({ success: false, message: error.message });
        return;
    }
    res.status(500).json({ success: false, message: 'Internal server error' })
}
