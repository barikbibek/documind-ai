import { z } from 'zod';

export const deleteDocumentSchema = z.object({
  docId: z.string().uuid(),
});