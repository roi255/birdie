import Notification from "../models/notification-model.js";
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
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: ["username", "fullName", "profilePic"],
      });
    if (posts.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json([posts]);
  } catch (error) {
    console.log("Error getting posts", error);
    res.status(500).json({ message: error.message });
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

//* like and unlike post

export const likeUnlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.includes(userId)) {
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await Post.updateOne({ _id: postId }, { $pull: { likedPosts: postId } });
    } else {
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
      await post.save();

      //send notification to the author of the post
      const newNotification = new Notification({
        type: "like",
        from: userId,
        to: post.user,
      });
      await newNotification.save();
      res.status(200).json({ message: "You liked this post" });
    }
  } catch (error) {
    console.log("Error liking post: ", error);
    res.status(500).json({ message: error.message });
  }
};

//* get all the liked posts

export const getLikedPosts = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: ["username", "fullName", "profilePic"],
      })
      .populate({
        path: "likes.user",
        select: ["username", "fullName", "profilePic"],
      });
    res.status(200).json(likedPosts);
  } catch (error) {
    console.log("Error getting liked posts: ", error);
    res.status(500).json({ message: error.message });
  }
};

//* get posts of people you are following

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const following = user.following;
    const feed = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: ["username", "fullName", "profilePic"],
      });

    res.status(200).json(feed);
  } catch (error) {
    console.log("Error getting feed: ", error);
    res.status(500).json({ message: error.message });
  }
};

//* get user posts

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: ["username", "fullName", "profilePic"],
      });

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error getting user posts: ", error);
    res.status(500).json({ message: error.message });
  }
};
