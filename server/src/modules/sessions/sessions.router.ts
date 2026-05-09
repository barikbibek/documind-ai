import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createSessionSchema, updateSessionSchema } from "./sessions.schema";
import { create, getOne, list, remove, update } from "./sessions.controller";

const router = Router()

router.use(authMiddleware)

router.post('/', validate(createSessionSchema), create)
router.get('/', list)
router.get('/:id', getOne)
router.patch('/:id', validate(updateSessionSchema), update)
router.delete('/:id', remove)

export default router;