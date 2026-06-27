require("dotenv").config();

const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

/* =========================
   Socket.IO
========================= */

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// Makes Socket.IO available inside route files
global.io = io;

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/* =========================
   Routes
========================= */

const authRoutes = require("./routes/authRoutes");
const childRoutes = require("./routes/childRoutes");
const chatRoutes = require("./routes/chatRoutes");
const doctorChatRoutes = require("./routes/doctorChatRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const aiRoutes = require("./routes/aiRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");
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

/* =========================
   Server Test Routes
========================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Emora server is running",
  });
});

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
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
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

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(
        `Local API: http://localhost:${PORT}/api/health`
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