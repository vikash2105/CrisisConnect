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

<<<<<<< HEAD
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
=======
// ✅ Environment Variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ✅ FRONTEND URL (IMPORTANT for Vercel)
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
>>>>>>> 094577356ad464c43002570066975adc57e46fb2

// ================= SOCKET.IO SETUP =================
const io = new Server(server, {
  cors: {
<<<<<<< HEAD
    origin: allowedOrigins,
=======
    origin: CLIENT_URL,
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible to routes
app.set("io", io);

// ================= MIDDLEWARE =================
app.use(express.json());
<<<<<<< HEAD
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
=======

// ✅ Proper CORS setup
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
>>>>>>> 094577356ad464c43002570066975adc57e46fb2

// ================= RATE LIMITING =================
app.use("/api", apiLimiter);

// ================= ROUTES =================
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/incidents", incidentLimiter, incidentRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/user-locations", userLocationRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/profile", profileRoutes);

<<<<<<< HEAD
// ================= ERROR HANDLING =================
app.use((err, req, res, next) => {
  console.error(`[API] ${req.method} ${req.originalUrl} error:`, err.message);

  if (err.message && err.message.startsWith("CORS blocked origin")) {
    return res.status(403).json({ message: "CORS origin is not allowed" });
  }

  return res.status(500).json({ message: "Server error" });
=======
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
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
});

// ================= SOCKET CONNECTION =================
io.on("connection", (socket) => {
<<<<<<< HEAD
  console.log("[Socket] User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("[Socket] User disconnected:", socket.id);
=======
  console.log("🔌 User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
  });
});

// ================= SERVER START =================
async function startServer() {
  try {
    if (!MONGO_URI) {
<<<<<<< HEAD
      throw new Error("MONGO_URI is missing. Set it in the Render environment before starting the server.");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing. Set it in the Render environment before starting the server.");
    }

    console.log("[MongoDB] Connecting...");
    await mongoose.connect(MONGO_URI);
    console.log("[MongoDB] Connected successfully");

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
=======
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
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
