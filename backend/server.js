require("dotenv").config();

const session = require("express-session");
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const errorMiddleware = require("./middleware/errorMiddleware");

const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const taskRouter = require("./routes/taskRouter");
const moveRouter = require("./routes/moveRouter");
const tripRouter = require("./routes/tripRouter");
const notificationRouter = require("./routes/notificationRouter");
const folderRouter = require("./routes/folderRouter");
const pictureRouter = require("./routes/pictureRouter");

const app = express();

app.set("trust proxy", 1);

app.use(express.json());

app.get("/api/db-health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ database: "connected" });
  } catch (error) {
    console.error("PostgreSQL health check failed:", error);
    res.status(503).json({ database: "disconnected" });
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3005",
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || "development-only-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  }
}));

app.use(require("connect-flash")());

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
