import type { Request, Response } from 'express';
import {
  uploadDocuments, getSessionDocuments,
  getDocumentById, deleteDocument
} from './documents.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { UsageLimitError } from '../usage/usage.service';
import { open, unlink } from 'node:fs/promises';
import { logger } from '../../utils/logger';

async function hasPdfSignature(path: string) {
  const handle = await open(path, 'r');
  try {
    const signature = Buffer.alloc(5);
    const { bytesRead } = await handle.read(signature, 0, 5, 0);
    return bytesRead === 5 && signature.toString() === '%PDF-';
  } finally {
    await handle.close();
  }
}

export async function upload(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      sendError(res, 'No files uploaded', 400);
      return;
    }
    if (!(await Promise.all(files.map(file => hasPdfSignature(file.path)))).every(Boolean)) {
      await Promise.allSettled(files.map(file => unlink(file.path)));
      sendError(res, 'Only valid PDF files are allowed', 400);
      return;
    }
    const docs = await uploadDocuments(files, (req.params.sessionId as any), req.user!.userId);
    sendSuccess(res, docs, 202); // 202 = Accepted (processing in background)
  } catch (err) {
    await Promise.allSettled(((req.files as Express.Multer.File[]) || []).map(file => unlink(file.path)));
    if (err instanceof UsageLimitError) return sendError(res, err.message, 429);
    if ((err as Error).message === 'Session not found') return sendError(res, 'Session not found', 404);
    logger.error(err);
    sendError(res, 'Upload failed. Please try again.', 500);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const docs = await getSessionDocuments((req.params.sessionId as any), req.user!.userId);
    sendSuccess(res, docs);
  } catch (err) {
    if ((err as Error).message === 'Session not found') return sendError(res, 'Session not found', 404);
    logger.error(err);
    sendError(res, 'Could not load documents', 500);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const doc = await getDocumentById(req.params.docId as any, req.user!.userId);
    sendSuccess(res, doc);
  } catch (err) {
    if ((err as Error).message === 'Document not found') return sendError(res, 'Document not found', 404);
    logger.error(err);
    sendError(res, 'Could not load document', 500);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await deleteDocument(req.params.docId as any, req.user!.userId);
    sendSuccess(res, { message: 'Document deleted' });
  } catch (err) {
    if ((err as Error).message === 'Document not found') return sendError(res, 'Document not found', 404);
    logger.error(err);
    sendError(res, 'Could not delete document', 500);
  }
}
