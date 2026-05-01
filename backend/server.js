// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const locationsRoutes = require("./routes/locationsRoutes");
const userLocationRoutes = require("./routes/userLocationRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const contributionRoutes = require("./routes/contributionRoutes");
const profileRoutes = require("./routes/profileRoutes");

// Import Rate Limiters
const { apiLimiter, authLimiter, incidentLimiter } = require("./middleware/rateLimiter");

const app = express();
const server = http.createServer(app);

// ✅ Environment Variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ✅ FRONTEND URL (IMPORTANT for Vercel)
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ================= SOCKET.IO SETUP =================
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible to routes
app.set("io", io);

// ================= MIDDLEWARE =================
app.use(express.json());

// ✅ Proper CORS setup
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// ================= RATE LIMITING =================
app.use("/api", apiLimiter);

// ================= ROUTES =================
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/incidents", incidentLimiter, incidentRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/user-locations", userLocationRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/profile", profileRoutes);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("CrisisConnect server is running 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// ================= SOCKET CONNECTION =================
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ================= SERVER START =================
async function startServer() {
  try {
    if (!MONGO_URI) {
      console.warn("⚠️ No MongoDB URI provided. Running without DB.");
    } else {
      await mongoose.connect(MONGO_URI);
      console.log("✅ MongoDB connected successfully");
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Allowed origin: ${CLIENT_URL}`);
      console.log(`⚡ WebSocket server ready`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.warn("⚠️ Starting server without DB connection");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  }
}

startServer();