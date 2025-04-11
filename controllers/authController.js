import User from "../models/userModal.js";
import bcrypt from "bcryptjs";
import _default from "../utils/mailer.js";
const { resetPasswordOtp,sendOtpEmail } = _default;
import __default from "../utils/mailer.js";
const { sendDeliveryBoysInformation } = __default;
import Order from "../models/orderModal.js";

import passport from "passport";
import { default as axios } from "axios";

import { Strategy as GitHubStrategy } from "passport-github2";
import pkg from "jsonwebtoken";
import { io } from "../app.js";
import { log } from "console";
const { sign } = pkg;
const { genSalt, hash, compare } = bcrypt;

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export async function register(req, res) {
  const { name, email, password, mobile } = req.body;

  const nameRegex = /^[A-Za-z]*\s[a-z.]*$/;
  const mobileRegex = /^\d{10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!nameRegex.test(name)) {
    return res.status(400).json({ msg: "Invalid name format" });
  }

  if (!mobileRegex.test(mobile)) {
    return res
      .status(400)
      .json({ msg: "Mobile number must be exactly 10 digits" });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "Invalid email format" });
  }

  try {
    let user = await User.findOne({ email });
    console.log("user",user);
    

    if (user) {
      if (user.otp === undefined) {
        return res.status(400).json({ msg: "User already exists" });
      }
      else {
        await User.deleteOne({ email });
        console.log("User deleted successfully");
      }
    }

    user = new User({
      name,
      email,
      password,
      mobile,
      otp: generateOtp(),
      otpExpires: Date.now() + 10 * 60 * 1000,
    });

    const salt = await genSalt(10);
    user.password = await hash(password, salt);

    await user.save();
    sendOtpEmail(user.email, user.otp);


    res.status(200).json({ msg: "OTP sent to email" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }
    if (user.otp !== undefined) {
      await User.findByIdAndDelete(user.id);
      return res
        .status(404)
        .json({ message: "please Proper Register you profile" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "You are the owner" });
    }
    if (user.role === "delivery") {
      return res.status(403).json({ message: "You are the deliveryBoy" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }
    const isPasswordValid = compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    user.status = "online";
    await user.save();

    const payload = { user: { id: user._id } };
    const userId = user._id;
    sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;

      res.json({
        message: "Login successful",
        userId,
        token,
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

export async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  try {
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const payload = { user: { id: user.id } };
    sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

export async function requestPasswordReset(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const otp = generateOtp();

    user.otp = otp;
    user.otpExpires = Date.now() + 600000;
    resetPasswordOtp(user.email, user.otp);
    await user.save();

    resetPasswordOtp(user.email, user.otp);

    res.json({ message: "OTP sent to email successfully" });
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).send("Server error");
  }
}

export async function verifyOtpAndUpdatePassword(req, res) {
  const { email, otp, newPassword } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const salt = await genSalt(10);
    user.password = await hash(newPassword, salt);

    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}
export async function adminLogin(req, res) {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    if (user.role === "user" ||user.role === "delivery") {
      return res.status(403).json({ message: "You are not the owner" });
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    user.status = "online";
    await user.save();
    setTimeout(async () => {
      user.status = "offline";
      await user.save();
    }, 3600000); // 1 hour

    const payload = { user: { id: user.id } };
    const userId = user._id;

    sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      res.json({
        message: "Login successful",
        token,
        userId,
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}
export async function getUserDetail(req, res) {
  try {
    const { userId } = req.body;

    const user = await User.findById({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
export async function UpdateUserDetail(req, res) {
  try {
    const { email, name, mobile, address } = req.body;

    const user = await User.findOne({ email });
    console.log(user);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.name = name;
    user.mobile = mobile;
    user.address = address;
    user.update = new Date();

    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
export async function getUserCount(req, res) {
  try {
    const role = "user";
    const userCount = await User.countDocuments({ role });
    res.status(200).json({ userCount });
  } catch (err) {
    console.error("Error fetching user count:", err);
    res.status(500).json({ error: "Failed to fetch user count" });
  }
}
export async function getAllUser(req, res) {
  try {
    const role = { $in: ["user", "delivery"] };
    const users = await User.find({ role });
    res.status(200).json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
}
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export function githubLogin(req, res) {
  const redirectUri = `${process.env.REACT_APP_API_BASE_URL}/auth/github/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;
  res.redirect(githubAuthUrl);
}

export async function githubCallback(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("GitHub authorization code not found");
    }

    const tokenResponse = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get(`https://api.github.com/user`, {
      headers: { Authorization: `token ${accessToken}` },
    });

    const emailResponse = await axios.get(
      `https://api.github.com/user/emails`,
      {
        headers: { Authorization: `token ${accessToken}` },
      }
    );

    const primaryEmail = emailResponse.data.find(
      (emailObj) => emailObj.primary
    )?.email;

    const email =
      primaryEmail || userResponse.data.email || "noemail@github.com";

    const name =
      userResponse.data.name || userResponse.data.login || "GitHub User";

    if (!email) {
      return res.status(400).send("GitHub account does not have a valid email");
    }

    let user = await User.findOne({ email });
    if (!user) {
      const password = "GitHubUser";
      const hashedPassword = await hash(password, 10);

      user = new User({
        name: name,
        email: email,
        password: hashedPassword,
      });
      await user.save();
    }

    const token = sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, { httpOnly: true });
    res.redirect(
      `http://localhost:3001/login?email=${user.email}&password=GitHubUser`
    );
  } catch (error) {
    console.error("Error during GitHub OAuth callback:", error);
    res.status(500).send("An error occurred during the GitHub login process");
  }
}

export async function UserUpdate(req, res) {
  try {
    const { id } = req.params;
    console.log(id);

    const { name, email, mobile, address, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          email,
          mobile,
          address,
          role,
          update: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
}

export async function DeleteUser(req, res) {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting user",
      error: error.message,
    });
  }
}
export async function GoogleRegister(req, res) {
  const { name, email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "Invalid email format" });
  }

  try {
    let user = await User.findOne({ email });
    if (!user) {
      const password = "GoogleUser";
      const hashedPassword = await hash(password, 10);

      user = new User({
        name: name,
        email: email,
        password: hashedPassword,
      });
      await user.save();
    }

    res.status(200).json({
      message: "Registration successful",
      data: user.email,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

export async function DeliveryBoyRegister(req, res) {
  try {
    const { name, email, phone, password, address } = req.body;

    const mobileRegex = /^\d{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!mobileRegex.test(phone)) {
      return res
        .status(400)
        .json({ message: "Mobile number must be exactly 10 digits" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ message: "User already exists" });
    }
    sendDeliveryBoysInformation(email, password);

    const saltRounds = 10;
    const hashedPassword = await hash(password, saltRounds);

    const role = "delivery";

    user = new User({
      name,
      email,
      mobile: phone,
      password: hashedPassword,
      address,
      role,
    });

    await user.save();

    res.status(201).json({
      message: "Delivery Boy registered successfully",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function BoyLogin(req, res) {
  const { email, password, role, latitude, longitude } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    // Check if the user's role is 'delivery'
    if (user.role !== role) {
      return res.status(403).json({ message: "Access denied: Not a delivery user" });
    }

    // Verify the password
    const isPasswordValid = compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const payload = { user: { id: user.id } };
    const token = sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Update user status and location
    user.location.latitude = latitude;
    user.location.longitude = longitude;
    user.status = "online";
    await user.save();

    // ✅ Automatically reset status and location after 1 hour
    setTimeout(async () => {
      try {
        await User.findByIdAndUpdate(user._id, {
          $set: { 
            status: "offline",
            "location.latitude": null,
            "location.longitude": null 
          }
        });
        console.log(`User ${user.email} set to offline after 1 hour`);
      } catch (error) {
        console.error("Error resetting user status:", error);
      }
    }, 60 * 60 * 1000); // 1 hour in milliseconds

    // Respond with token and user details
    res.status(200).json({
      message: "Login successful",
      token,
      userId: user._id,
    });

  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

export async function logOut(req, res) {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  user.location.latitude = "";
  user.location.longitude = "";
  user.status = "offline";
  await user.save();
  res.status(200).json({ message: "Logged out successfully" });
}

export async function GetAllOnlineBoy(req, res) {
  try {
    const onlineBoys = await User.find({
      $and: [{ role: "delivery" }, { status: "online" }]
    });
    if (!onlineBoys || onlineBoys.length === 0) {
      return res.status(404).json({ message: "No online delivery boys found" });
    }

    const deliveryBoyIds = onlineBoys.map((boy) => boy._id);
    const assignedOrders = await Order.find({
      deliveryBoyId: { $in: deliveryBoyIds },
      status: { $in: ["pending", "running"] }
    });

    const assignedBoyIds = assignedOrders.map(order => order.deliveryBoyId.toString());
    const availableBoys = onlineBoys.filter(boy => !assignedBoyIds.includes(boy._id.toString()));

    if (availableBoys.length === 0) {
      return res.status(404).json({ message: "No available delivery boys without recent orders" });
    }

    res.status(200).json({ availableBoys });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
