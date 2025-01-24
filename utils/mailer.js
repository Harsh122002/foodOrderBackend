const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Not Loaded");

const sendOtpEmail = (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

const resetPasswordOtp = (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset OTP",
    text: `You are receiving this because you (or someone else) have requested to reset the password for your account.\n\n
    Your OTP code is: ${otp}\n\n
    If you did not request this, please ignore this email and your password will remain unchanged.\n`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};
const sendOrderConfirmation = (email, status) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Order Status",
    text: `Thank you for your order!\n\nYour order is ${status}. Please check your order status after some time.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Order confirmation email sent:", info.response);
    }
  });
};
const sendDeliveryBoysInformation = (email, password) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Login UserName and Password",
    text: `your username=${email}\n password=${password}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Order confirmation email sent:", info.response);
    }
  });
};

const deleteOrderConfirmation = (email, status) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Order Cancellation Confirmation",
    text: `Dear Customer,

Thank you for your order. 

We regret to inform you that your order status is now: "${status}". If applicable, any payment made will be refunded to your account within 7 business days. 

`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Order cancellation email sent successfully:", info.response);
    }
  });
};

module.exports = { sendOtpEmail, resetPasswordOtp, sendOrderConfirmation,deleteOrderConfirmation,sendDeliveryBoysInformation };
