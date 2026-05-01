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
const { apiLimiter, authLimiter, incidentLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(express.json());
app.use(cors());

// Apply general API rate limiter to all routes
app.use("/api", apiLimiter);

// Routes with specific rate limits
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/incidents", incidentLimiter, incidentRoutes);

// Other routes (already protected by general apiLimiter)
app.use("/api/locations", locationsRoutes);
app.use("/api/user-locations", userLocationRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/profile", profileRoutes);

// WebSocket Connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Default route (health check)
app.get("/", (req, res) => {
  res.send("CrisisConnect server is up and running!");
});

// MongoDB Connection + Server Start
async function startServer() {
  try {
    if (!MONGO_URI) {
      console.warn("No MongoDB URI provided. Server will run without DB features.");
    } else {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("MongoDB connected successfully");
    }

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`WebSocket server ready`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.warn("Starting server without DB connection (DB-dependent features won't work).");

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`WebSocket server ready`);
    });
  }
}

startServer();