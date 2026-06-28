const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const clearanceRoutes = require("./src/routes/clearanceRoutes");

dotenv.config({ path: __dirname + "/.env" });
connectDB();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/clearance", clearanceRoutes);

app.get("/", (req, res) => {
  res.json({ message: "RVNP Clearance API running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server 🏃‍♂️‍➡️ on port ${PORT}🚀`));
