

/**
 * Reference wiring — merge this into your existing server.js.
 * Order matters: security middleware before routes, routes in the order
 * shown (auth → public → admin).
 */
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import publicRoutes from "./routes/public.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import locationRoutes from "./routes/location.routes.js";

dotenv.config();

const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "CLIENT_ORIGIN"];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const app = express();

// --- Security middleware, before anything else ------------------------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN, // exact frontend origin, not "*"
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" })); // nomination payloads are small; cap to blunt oversized-body abuse
// app.use(mongoSanitize()); // strips $ and . operators from req.body/query/params — blocks NoSQL injection

// --- Routes --------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes); // POST /api/responses
app.use("/api/admin", adminRoutes); // GET/POST/PATCH /api/admin/submissions, GET /api/admin/export
app.use("/api/locations", locationRoutes); // GET /lgas, /wards?lga=, /polling-units?lga=&ward=

// --- Fallback error handler ----------------------------------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Something went wrong." });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Mongodb Connected")
    app.listen(process.env.PORT || 5000, () => {
      console.log(`PUC server listening on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });