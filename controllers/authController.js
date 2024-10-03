const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/mailer");
const { resetPasswordOtp } = require("../utils/mailer");
const passport = require("passport");
const { default: axios } = require("axios");

const GitHubStrategy = require("passport-github2").Strategy;
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
  const { name, email, password, mobile } = req.body;

  // Regular expressions for validation
  const nameRegex = /^[A-Za-z]+$/;
  const mobileRegex = /^\d{10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate name
  if (!nameRegex.test(name)) {
    return res
      .status(400)
      .json({ msg: "Name must contain only alphabetic characters" });
  }

  // Validate mobile
  if (!mobileRegex.test(mobile)) {
    return res
      .status(400)
      .json({ msg: "Mobile number must be exactly 10 digits" });
  }

  // Validate email
  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "Invalid email format" });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    user = new User({
      name,
      email,
      password,
      mobile,
      otp: generateOtp(),
      otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    sendOtpEmail(user.email, user.otp);

    res.status(200).json({ msg: "OTP sent to email" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "You are the owner" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }
    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const payload = { user: { id: user._id } };
    const userId = user._id;
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;

        res.json({
          message: "Login successful",
          userId,
          token,
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.verifyOtp = async (req, res) => {
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
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
        // res.redirect(`http://localhost:3000/login`);
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.requestPasswordReset = async (req, res) => {
  console.log("Request body:", req.body);
  const { email } = req.body;
  console.log("Extracted email:", email);

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    // Generate OTP
    const otp = generateOtp(); // 6-digit OTP

    user.otp = otp;
    user.otpExpires = Date.now() + 600000; // 10 minutes from now
    resetPasswordOtp(user.email, user.otp);
    await user.save();

    // Send OTP email
    resetPasswordOtp(user.email, user.otp);

    res.json({ message: "OTP sent to email successfully" });
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).send("Server error");
  }
};

exports.verifyOtpAndUpdatePassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    // Check if OTP is valid
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP and expiration
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    // Check if the user is an admin
    if (user.role === "user") {
      return res.status(403).json({ message: "You are the owner" });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({
          message: "Login successful",
          token,
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
exports.getUserDetail = async (req, res) => {
  try {
    const { userId } = req.body;

    // Fetch user details from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send user details as JSON response
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
exports.UpdateUserDetail = async (req, res) => {
  try {
    const { email, name, mobile, address } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user details
    user.name = name;
    user.mobile = mobile;
    user.address = address;
    user.update = new Date();

    // Save changes to the database
    await user.save();

    // Send updated user details in response
    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// controllers/userController.js
exports.getUserCount = async (req, res) => {
  try {
    const role = "user";
    const userCount = await User.countDocuments({ role }); // Corrected query syntax
    res.status(200).json({ userCount });
  } catch (err) {
    console.error("Error fetching user count:", err);
    res.status(500).json({ error: "Failed to fetch user count" });
  }
};
exports.getAllUser = async (req, res) => {
  try {
    const role = "user";
    console.log("Fetching users with role:", role);
    const users = await User.find({ role });
    res.status(200).json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
};
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

exports.githubLogin = (req, res) => {
  const redirectUri = `${process.env.REACT_APP_API_BASE_URL}/auth/github/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;
  res.redirect(githubAuthUrl);
};

exports.githubCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("GitHub authorization code not found");
    }

    // Exchange the code for an access token
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

    // Fetch user information from GitHub
    const userResponse = await axios.get(`https://api.github.com/user`, {
      headers: { Authorization: `token ${accessToken}` },
    });

    // Get additional email if available
    const emailResponse = await axios.get(
      `https://api.github.com/user/emails`,
      {
        headers: { Authorization: `token ${accessToken}` },
      }
    );

    // Get primary email or fallback to a placeholder
    const primaryEmail = emailResponse.data.find(
      (emailObj) => emailObj.primary
    )?.email;

    // Fallback for missing primary email
    const email =
      primaryEmail || userResponse.data.email || "noemail@github.com";

    const name =
      userResponse.data.name || userResponse.data.login || "GitHub User";

    // Handle missing name or email from GitHub
    if (!email) {
      return res.status(400).send("GitHub account does not have a valid email");
    }

    // Check if user already exists in the database
    let user = await User.findOne({ email });
    if (!user) {
      const password = "GitHubUser";
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

      user = new User({
        name: name,
        email: email,
        password: hashedPassword, // Default password for GitHub users
        // Mobile field is optional, so we don't have to worry about it
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Set JWT token in a cookie
    res.cookie("token", token, { httpOnly: true });
    res.redirect(
      `http://localhost:3001/login?email=${user.email}&password=GitHubUser`
    ); // Pass email and random password
  } catch (error) {
    console.error("Error during GitHub OAuth callback:", error);
    res.status(500).send("An error occurred during the GitHub login process");
  }
};
