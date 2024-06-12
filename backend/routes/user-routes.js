import express from "express";
import {
  followUnfollowUser,
  getSuggestedUsers,
  getUserProfile,
} from "../controllers/user-controller.js";
import { protectedRoute } from "../middleware/protected-route.js";

const router = express.Router();

router.get("/profile/:username", protectedRoute, getUserProfile);
router.get("/suggested", protectedRoute, getSuggestedUsers);
router.post("/follow/:id", protectedRoute, followUnfollowUser);
// router.post("/update", protectedRoute, updateUserProfile);

export default router;
