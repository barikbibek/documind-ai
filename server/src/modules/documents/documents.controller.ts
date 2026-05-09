import type { Request, Response } from 'express';
import {
  uploadDocuments, getSessionDocuments,
  getDocumentById, deleteDocument
} from './documents.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

export async function upload(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      sendError(res, 'No files uploaded', 400);
      return;
    }
    const docs = await uploadDocuments(files, (req.params.sessionId as any), req.user!.userId);
    sendSuccess(res, docs, 202); // 202 = Accepted (processing in background)
  } catch (err) {
    sendError(res, (err as Error).message, 400);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const docs = await getSessionDocuments((req.params.sessionId as any), req.user!.userId);
    sendSuccess(res, docs);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const doc = await getDocumentById(req.params.docId as any, req.user!.userId);
    sendSuccess(res, doc);
  } catch (err) {
    sendError(res, (err as Error).message, 404);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await deleteDocument(req.params.docId as any, req.user!.userId);
    sendSuccess(res, { message: 'Document deleted' });
  } catch (err) {
    sendError(res, (err as Error).message, 404);
  }
}