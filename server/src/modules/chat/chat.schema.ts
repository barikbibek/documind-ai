import { z } from 'zod';

export const sendMessageSchema = z.object({
  question: z.string().trim().min(1).max(2000),
});
