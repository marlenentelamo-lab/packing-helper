require("dotenv").config();

const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const express = require("express");
const cors = require("cors");
const pool = require("./db/db");

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  'http://localhost:3005', 
  'https://packing-helper-pi.vercel.app', 
  'https://packing-helper-adqx35kwm-marlenentelamo-gmailcoms-projects.vercel.app'];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    return next();
  }

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: 'CORS policy violation' });
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());

app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),

    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.use(require("connect-flash")());

app.get("/api/db-health", async (req, res) => {
console.log("Performing PostgreSQL health check...");
  try {
    await pool.query("SELECT 1");
    res.json({ database: "connected" });
  } catch (error) {
    console.error("PostgreSQL health check failed:", error);
    res.status(503).json({ database: "disconnected" });
  }
});

const errorMiddleware = require("./middleware/errorMiddleware");

const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const taskRouter = require("./routes/taskRouter");
const moveRouter = require("./routes/moveRouter");
const tripRouter = require("./routes/tripRouter");
const notificationRouter = require("./routes/notificationRouter");
const folderRouter = require("./routes/folderRouter");
const pictureRouter = require("./routes/pictureRouter");

app.use("/api", authRouter);
app.use("/api/users", userRouter);
app.use("/api", taskRouter);
app.use("/api", moveRouter);
app.use("/api", tripRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/picture-folders", folderRouter);
app.use("/api/pictures", pictureRouter);

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 3004;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
