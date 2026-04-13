require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const db = require("./config/db"); // connection is established here

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));

app.get("/", (req, res) => {
  res.send("API Running");
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));