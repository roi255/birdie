import express from "express";
import {
  getUser,
  login,
  logout,
  signup,
} from "../controllers/auth-controller.js";
import { protectedRoute } from "../middleware/protected-route.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/getUser", protectedRoute, getUser);

export default router;
