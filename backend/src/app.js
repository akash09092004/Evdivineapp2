const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

const isLocalDevOrigin = (origin) => {
  if (!origin) return false;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

const allowedOrigins = new Set(
  [process.env.CLIENT_URL, process.env.ADMIN_URL].filter(Boolean)
);

const corsOptions =
  process.env.NODE_ENV === "production"
    ? {
        origin: (origin, callback) => {
          if (!origin) {
            callback(null, true);
            return;
          }

          if (allowedOrigins.has(origin)) {
            callback(null, true);
            return;
          }

          callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
        optionsSuccessStatus: 200,
      }
    : {
        origin: true,
        credentials: true,
        optionsSuccessStatus: 200,
      };

const staticUploadsPath = path.resolve(__dirname, "..", "uploads");
const isAdminChatRoute = (url = "") =>
  /^\/api\/admin\/chat-access-requests(?:\/|$)/.test(String(url)) ||
  /^\/api\/admin\/chat-requests(?:\/|$)/.test(String(url)) ||
  /^\/api\/admin\/chat(?:\/|$)/.test(String(url));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(
  "/uploads",
  express.static(staticUploadsPath, {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  })
);
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    skip: (req) => isAdminChatRoute(req.originalUrl || req.url || ""),
    handler: (req, res) => {
      console.log(
        "[rateLimit] blocked",
        req.method,
        req.originalUrl,
        "ip=",
        req.ip,
        "reason=too_many_requests"
      );
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        code: "RATE_LIMITED",
      });
    },
  })
);

app.get("/health", (req, res) => res.json({ success: true, message: "OK" }));
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
