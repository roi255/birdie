import Post from "../models/post-model.js";
import User from "../models/user-model.js";
import { v2 as cloudinary } from "cloudinary";

//* create post function

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { photo } = req.body;
    const userId = req.user._id.toString();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!text && !photo) return res.status(404).json({ error: "Post must have a text or image" });
    if (photo) {
      const uploadedPhoto = await cloudinary.uploader.upload(photo);
      photo = uploadedPhoto.secure_url;
    }

    const newPost = new Post({
      text,
      photo,
      user: userId,
      likes: [],
      comments: [],
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.log("Error creating post: ", error);
    res.status(500).json({ message: error.message });
  }
};

//* function to get all posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//* delete post

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this post" });
    }
    if (post.photo) {
      const photoId = post.photo.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(photoId);
    }
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    console.log("Error deleting post: ", error);
    res.status(500).json({ message: error.message });
  }
};

//* comment on post

export const commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) return res.status(400).json({ message: "Text is required" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = { text, user: userId };
    post.comments.push(comment);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log("Error commenting on post: ", error);
    res.status(500).json({ message: error.message });
  }
};
