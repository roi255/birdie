import express from "express";
import {
  commentPost,
  createPost,
  deletePost,
  getFollowingPosts,
  getLikedPosts,
  getPosts,
  getUserPosts,
  likeUnlikePost,
} from "../controllers/post-controller.js";
import { protectedRoute } from "../middleware/protected-route.js";

const router = express.Router();

router.post("/create", protectedRoute, createPost);
router.post("/like/:id", protectedRoute, likeUnlikePost);
router.post("/comment/:id", protectedRoute, commentPost);
router.delete("/:id", protectedRoute, deletePost);
router.get("/all", protectedRoute, getPosts);
router.get("/following", protectedRoute, getFollowingPosts);
router.get("/liked/:id", protectedRoute, getLikedPosts);
router.get("/user/:username", protectedRoute, getUserPosts);

export default router;
