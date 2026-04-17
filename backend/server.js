require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");

const app = express();

// DB Connection
require("./config/db");

// Routes
const userRoutes = require("./routes/userRoutes");
const societyRoutes = require("./routes/societyRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.send("API Running");
});

// ✅ Users API
app.use("/api/users", userRoutes);
app.use("/api/societies", societyRoutes);
app.use("/api/settings", settingsRoutes);

// ❗ TEMP: Comment auth until ready
app.use("/api/auth", require("./routes/authRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
