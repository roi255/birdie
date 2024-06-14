import express from "express";
import { protectedRoute } from "../middleware/protected-route.js";
import { commentPost, createPost, deletePost, getPosts } from "../controllers/post-controller.js";

const router = express.Router();

router.post("/create", protectedRoute, createPost);
// router.post("like/:id", likeUnlikePost);
router.post("/comment/:id", protectedRoute, commentPost);
router.delete("/:id", protectedRoute, deletePost);
// router.get("/posts", protectedRoute, getPosts);

export default router;
