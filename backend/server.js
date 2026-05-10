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
const Incident = require("./models/Incident");

// Import Rate Limiters
const { apiLimiter, authLimiter, incidentLimiter } = require("./middleware/rateLimiter");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://crisis-connect-three.vercel.app",
];

const normalizeOrigin = (origin) => origin?.replace(/\/$/, "");
const allowedOrigins = Array.from(
  new Set(
    [
      ...DEFAULT_ALLOWED_ORIGINS,
      ...CLIENT_URL.split(",").map((origin) => origin.trim()),
    ]
      .map(normalizeOrigin)
      .filter(Boolean)
  )
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedOrigin = normalizeOrigin(origin);
    const isAllowed = allowedOrigins.includes(normalizedOrigin);
    console.log(`[CORS] ${isAllowed ? "Allowed" : "Blocked"} origin: ${origin}`);

    if (isAllowed) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};

// ================= SOCKET.IO SETUP =================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible to routes
app.set("io", io);

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.on("finish", () => {
    if (req.path.startsWith("/api") && res.statusCode >= 400) {
      console.error(`[API] ${req.method} ${req.originalUrl} failed with ${res.statusCode}`);
    }
  });
  next();
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("CrisisConnect server is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// ================= RATE LIMITING =================
app.use("/api", apiLimiter);

// ================= ROUTES =================
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/incidents", incidentLimiter, incidentRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/user-locations", userLocationRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/profile", profileRoutes);

async function expireStaleIncidents() {
  try {
    const result = await Incident.updateMany(
      {
        isExpired: { $ne: true },
        activeUntil: { $lte: new Date() },
        status: { $ne: "Resolved" },
      },
      { $set: { isExpired: true } }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Expiry] Archived ${result.modifiedCount} expired incident reports`);
    }
  } catch (error) {
    console.error("[Expiry] Failed to archive expired incidents:", error.message);
  }
}

// ================= ERROR HANDLING =================
app.use((err, req, res, next) => {
  console.error(`[API] ${req.method} ${req.originalUrl} error:`, err.message);

  if (err.message && err.message.startsWith("CORS blocked origin")) {
    return res.status(403).json({ message: "CORS origin is not allowed" });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Image is too large. Please upload an image under 8 MB." });
  }

  if (err.message === "Only image uploads are allowed") {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Server error" });
});

// ================= SOCKET CONNECTION =================
io.on("connection", (socket) => {
  console.log("[Socket] User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("[Socket] User disconnected:", socket.id);
  });
});

// ================= SERVER START =================
async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing. Set it in the Render environment before starting the server.");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing. Set it in the Render environment before starting the server.");
    }

    console.log("[MongoDB] Connecting...");
    await mongoose.connect(MONGO_URI);
    console.log("[MongoDB] Connected successfully");
    await expireStaleIncidents();
    setInterval(expireStaleIncidents, 15 * 60 * 1000);

    server.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
      console.log(`[Server] Allowed origins: ${allowedOrigins.join(", ")}`);
      console.log("[Socket] WebSocket server ready");
    });
  } catch (err) {
    console.error("[Server] Startup failed:", err.message);
    process.exit(1);
  }
}

startServer();
