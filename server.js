<<<<<<< Updated upstream
require('dotenv').config();
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const server = http.createServer(app);
const io = require('socket.io')(server);
global.io = io;


const authRoutes = require('./routes/authRoutes');
const childRoutes = require('./routes/childRoutes');
const chatRoutes = require('./routes/chatRoutes');
const doctorChatRoutes = require('./routes/doctorChatRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');

=======

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Routes
const authRoutes = require("./routes/authRoutes");
const childRoutes = require("./routes/childRoutes");
const chatRoutes = require("./routes/chatRoutes");
const doctorChatRoutes = require("./routes/doctorChatRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();
>>>>>>> Stashed changes

/* =========================
   Middlewares
========================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Print every request in the backend terminal
app.use((req, res, next) => {
  console.log(
    new Date().toISOString(),
    req.method,
    req.originalUrl
  );

  next();
});

<<<<<<< Updated upstream
app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/doctor-chat', doctorChatRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
=======
/* =========================
   Server Test Routes
========================= */
>>>>>>> Stashed changes

// Test the main server
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Emora server is running",
  });
});

// Test the API from mobile or browser
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Emora API is working",
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   Application Routes
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/children", childRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/doctor-chat", doctorChatRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/ai", aiRoutes);

/* =========================
   Route Not Found
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    route: req.originalUrl,
  });
});

/* =========================
   Global Error Handler
========================= */

app.use((error, req, res, next) => {
  console.error("Server Error:", error);

  res.status(error.status || 500).json({
    success: false,
    message:
      error.message ||
      "An unexpected server error occurred",
  });
});

/* =========================
   Database and Server
========================= */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from the .env file"
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        "Server is running on port " + PORT
      );

      console.log(
        "Local API: http://localhost:" +
          PORT +
          "/api/health"
      );

      console.log(
        "Mobile API: http://192.168.1.7:" +
          PORT +
          "/api/health"
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
};

startServer();

