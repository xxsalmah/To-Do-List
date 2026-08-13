const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const User = require("./models/User");
const Task = require("./models/Task");

const app = express();

// ===============================
// ENVIRONMENT
// ===============================

const PORT = process.env.PORT || 5000;
const production = process.env.NODE_ENV === "production";

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5174";

// ===============================
// MIDDLEWARE
// ===============================

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ===============================
// TEST ROUTE
// ===============================

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// ===============================
// REGISTER
// ===============================

app.post("/api/register", async (req, res) => {
  console.log("REGISTER REQUEST RECEIVED");

  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all fields",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    console.log("USER SAVED!");

    res.status(201).json({
      message: "Registration successful!",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ===============================
// LOGIN
// ===============================

app.post("/api/login", async (req, res) => {
  console.log("LOGIN REQUEST RECEIVED");

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.cookie("auth", user._id.toString(), {
      httpOnly: true,
      sameSite: production ? "none" : "lax",
      secure: production,
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("LOGIN SUCCESSFUL");

    res.json({
      message: "Login successful!",
      username: user.username,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ===============================
// CURRENT USER
// ===============================

app.get("/api/me", async (req, res) => {
  try {
    const userId = req.cookies.auth;

    if (!userId) {
      return res.status(401).json({
        message: "Not logged in",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    res.json({
      loggedIn: true,
      user,
    });
  } catch (error) {
    console.error("ME ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ===============================
// DASHBOARD
// ===============================

app.get("/api/dashboard", async (req, res) => {
  try {
    const userId = req.cookies.auth;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in to access the dashboard.",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    res.json({
      message: "Welcome to your dashboard!",
      user,
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ===============================
// LOGOUT
// ===============================

app.post("/api/logout", (req, res) => {
  console.log("LOGOUT REQUEST RECEIVED");

  res.clearCookie("auth", {
    httpOnly: true,
    sameSite: production ? "none" : "lax",
    secure: production,
  });

  res.json({
    message: "Logged out successfully!",
  });
});

// ===============================
// GET TASKS
// ===============================

app.get("/api/tasks", async (req, res) => {
  try {
    const userId = req.cookies.auth;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    const tasks = await Task.find({
      userId,
    }).sort({
      createdAt: -1,
    });

    res.json(tasks);
  } catch (error) {
    console.error("GET TASKS ERROR:", error);

    res.status(500).json({
      message: "Could not get tasks.",
    });
  }
});

// ===============================
// CREATE TASK
// ===============================

app.post("/api/tasks", async (req, res) => {
  console.log("CREATE TASK REQUEST RECEIVED");

  try {
    const userId = req.cookies.auth;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    const {
      text,
      category,
      priority,
      dueDate,
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Task text is required.",
      });
    }

    const allowedPriorities = [
      "Low",
      "Medium",
      "High",
    ];

    const taskPriority =
      allowedPriorities.includes(priority)
        ? priority
        : "Medium";

    const task = new Task({
      text: text.trim(),
      category: category || "Brain Dump",
      priority: taskPriority,
      dueDate: dueDate || null,
      userId,
    });

    await task.save();

    console.log("TASK SAVED:", task.text);

    res.status(201).json({
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);

    res.status(500).json({
      message: "Could not create task.",
    });
  }
});

// ===============================
// TOGGLE TASK
// ===============================

app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const userId = req.cookies.auth;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    task.completed = !task.completed;

    await task.save();

    res.json({
      message: "Task updated.",
      task,
    });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);

    res.status(500).json({
      message: "Could not update task.",
    });
  }
});

// ===============================
// EDIT TASK
// ===============================

app.put("/api/tasks/:id", async (req, res) => {
  console.log("EDIT TASK REQUEST RECEIVED");

  try {
    const userId = req.cookies.auth;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    const {
      text,
      category,
      priority,
      dueDate,
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Task text is required.",
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    task.text = text.trim();

    if (category) {
      task.category = category;
    }

    const allowedPriorities = [
      "Low",
      "Medium",
      "High",
    ];

    if (
      priority &&
      allowedPriorities.includes(priority)
    ) {
      task.priority = priority;
    }

    task.dueDate = dueDate || null;

    await task.save();

    console.log("TASK EDITED:", task.text);

    res.json({
      message: "Task updated successfully.",
      task,
    });
  } catch (error) {
    console.error("EDIT TASK ERROR:", error);

    res.status(500).json({
      message: "Could not edit task.",
    });
  }
});

// ===============================
// DELETE TASK
// ===============================

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const userId = req.cookies.auth;

    if (!userId) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    res.json({
      message: "Task deleted.",
    });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);

    res.status(500).json({
      message: "Could not delete task.",
    });
  }
});

// ===============================
// MONGODB
// ===============================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected!");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });

// ===============================
// SERVER
// ===============================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});