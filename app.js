const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Route = require("./routes/MyRouter");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Change this to your frontend URL on Render
        methods: ["GET", "POST"],
    },
});

// Make `io` accessible in routes via req.app.io
app.set("io", io);

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/", Route);

// Static file serving
app.use("/Events", express.static(path.join(__dirname, "Events")));
app.use("/Gallery", express.static(path.join(__dirname, "Gallery")));

// MongoDB connection
mongoose
    .connect("mongodb+srv://vks7633a:42QMW3lvS9Tev70f@cluster0.otls6.mongodb.net/blooddonation")
    .then(() => {
        console.log("Connection established");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });

// Basic endpoints
app.get("/", (req, res) => {
    res.send("Server still running...");
});

// Start server (use Render's PORT env var)
const PORT = 7001;
server.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});

// Export Express app only (for testing or external usage)
module.exports = app;
