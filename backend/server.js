const express = require("express");
const path = require("path");
const connectDB = require("./db");
const cors = require("cors");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cors());
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Connect to MongoDB and seed if available before starting the server
const store = require("./dataStore");

async function init() {
  await connectDB();
  try {
    await store.ensureSeed();
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/follows", require("./routes/follows"));

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.get("/app.js", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "app.js"));
});

app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "style.css"));
});

const requestedPort = Number(process.env.PORT) || 5000;

const startServer = (port) => {
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.warn(`Port ${port} is busy. Trying ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    console.error(error);
    process.exit(1);
  });
};

// Start server after init completes (connectDB + seeding)
init().then(() => startServer(requestedPort)).catch((err) => {
  console.error("Initialization error:", err);
  startServer(requestedPort);
});