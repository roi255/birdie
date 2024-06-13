import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

//models
import Notification from "../models/notification-model.js";
import User from "../models/user-model.js";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in get user profile: ", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "Can't follow/unfollow own account" });
    }
    if (!userToModify || !currentUser) res.status(400).json({ error: "User not found" });
    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

      //TODO: return user id as response

      res.status(200).json({ message: "You unfollowed this account" });
    } else {
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      //* send notification to user
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id,
      });
      await newNotification.save();

      //TODO: return user id as response
      res.status(200).json({ message: "You are now following this account" });
    }
  } catch (error) {
    console.log("Error following/unfollowing user: ", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const usersFollowing = await User.findById(userId).select("following");
    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = users.filter((user) => !usersFollowing.following.includes(user._id));
    const suggestedUsers = filteredUsers.slice(0, 4);
    suggestedUsers.forEach((user) => user.password == null);
    res.status(200).json(suggestedUsers);
  } catch (err) {
    console.log("Error getting suggested users: ", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, fullName, email, currentPassword, newPassword, bio, link } = req.body;
    let { profilePic, coverPic } = req.body;
    const userId = req.user._id;

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
      return res.status(400).json({ message: "Please enter both current and new passwords" });
    }

    if (currentPassword && newPassword) {
      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordCorrect) return res.status(400).json({ message: "Current password is incorrect" });
      if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }

    //update profile pic
    if (profilePic) {
      //delete existing profile in cloudinary storage
      if (user.profilePic) {
        await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
      }
      const uploadedResponse = await cloudinary.uploader.upload(profilePic);
      profilePic = uploadedResponse.secure_url();
    }

    //update cover pic
    if (coverPic) {
      //delete existing cover in cloudinary storage
      if (user.coverPic) {
        await cloudinary.uploader.destroy(user.coverPic.split("/").pop().split(".")[0]);
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverPic);
      coverPic = uploadedResponse.secure_url();
    }

    user.username = username || user.username;
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profilePic = profilePic || user.profilePic;
    user.coverPic = coverPic || user.coverPic;

    user = await user.save();

    // user password should be null in response
    user.password = null;

    res.status(200).json(user);
  } catch (error) {
    console.log("Error updating profile: ", error.message);
    res.status(500).json({ error: error.message });
  }
};
