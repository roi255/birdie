import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user-model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email address",
      });
    }
    const checkUsername = await User.findOne({ username });
    if (checkUsername) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    const checkEmail = await User.findOne({ email });
    if (checkEmail) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
    });
    if (user) {
      generateTokenAndSetCookie(user._id, res);
      await user.save();
      return res.status(201).json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        followers: user.followers,
        following: user.following,
        profilePic: user.profilePic,
        coverPic: user.coverPic,
      });
    } else {
      res.status(400).json({
        error: "Invalid user data",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const verifyPassword = await bcrypt.compare(password, user?.password || "");
    if (user && verifyPassword) {
      generateTokenAndSetCookie(user._id, res);
      return res.status(200).json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        followers: user.followers,
        following: user.following,
        profilePic: user.profilePic,
        coverPic: user.coverPic,
      });
    } else {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
export const logout = async (req, res) => {
  try {
    res.clearCookie("jwt");
    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getuser controller", error.message);
    res.status(500).json({
      message: error.message,
    });
  }
};
