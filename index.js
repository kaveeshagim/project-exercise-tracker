const express = require("express");
const app = express();
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// in-memory user storage
let userLogs = [];

// ✅ Create user
app.post("/api/users", (req, res) => {
  console.log(req.body);
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const _id = crypto.randomBytes(12).toString("hex");

  userLogs.push({
    username: username,
    _id,
    log: [],
  });
  // Save user to database or perform other actions
  res.json({ username: username, _id });
});

// ✅ Get all users
app.get("/api/users", (req, res) => {
  const users = userLogs.map(({ _id, username }) => ({ _id, username }));
  res.json(users);
});

// ✅ Add exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res
      .status(400)
      .json({ error: "Description and duration are required" });
  }

  console.log({ userLogs });

  const user = userLogs.find((u) => u._id === _id);
  console.log({ user });
  if (!user) return res.status(404).json({ error: "User not found" });

  const exerciseDate = date ? new Date(date) : new Date();
  const exercise = {
    description,
    duration: parseInt(duration),
    date: exerciseDate, // store as Date object for filtering
  };

  user.log.push(exercise);

  res.status(201).json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: user._id,
  });
});

// ✅ Get logs with optional filters
app.get("/api/users/:_id/logs", (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = userLogs.find((u) => u._id === _id);
  if (!user) return res.status(404).json({ error: "User not found" });

  let logs = [...user.log]; // Clone log

  // ✅ Filter by date range
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate)) {
      logs = logs.filter((entry) => entry.date >= fromDate);
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate)) {
      logs = logs.filter((entry) => entry.date <= toDate);
    }
  }

  // ✅ Apply limit
  if (limit) {
    logs = logs.slice(0, parseInt(limit));
  }

  res.json({
    username: user.username,
    count: logs.length,
    _id: user._id,
    log: logs.map((entry) => ({
      description: entry.description,
      duration: entry.duration,
      date: entry.date.toDateString(), // format it here only
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
