import type { Request, Response } from 'express';
import { getUsage } from './usage.service';
import { sendSuccess } from '../../utils/apiResponse';

export async function usage(req: Request, res: Response) {
  sendSuccess(res, await getUsage(req.user!.userId));
}
