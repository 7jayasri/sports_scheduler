import express from "express";
import { createSession, getSessions, joinSession, cancelSession } from "../controllers/sessionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createSession);
router.get("/", getSessions);
router.put("/:id/join", protect, joinSession);
router.put("/:id/cancel", protect, cancelSession);

export default router;
