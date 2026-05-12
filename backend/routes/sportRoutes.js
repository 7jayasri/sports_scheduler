import express from "express";
import { createSport, getSports } from "../controllers/sportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createSport);
router.get("/", getSports);

export default router;
