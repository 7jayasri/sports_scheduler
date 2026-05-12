import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import Sport from "./models/Sport.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// User Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" }
});
const User = mongoose.model("User", userSchema);

// Session Model - Updated with team support
const sessionSchema = new mongoose.Schema({
  sport: { type: String, required: true },
  venue: { type: String, required: true },
  dateTime: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  teamA: [{ type: String }],
  teamB: [{ type: String }],
  additionalPlayers: { type: Number, default: 0 },
  cancelled: { type: Boolean, default: false },
  cancellationReason: { type: String }
});
const Session = mongoose.model("Session", sessionSchema);

// Signup
app.post("/signup", async (req, res) => {
  try {
    console.log('Signup request:', req.body);
    
    const { name, email, password, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    
    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');
    
    // Create user
    const newUser = new User({ 
      name, 
      email: email.toLowerCase(), // Store email in lowercase
      password: hashedPassword, 
      role: role || 'user' 
    });
    
    await newUser.save();
    console.log('User created successfully:', email);
    
    // Return user without password
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };
    
    res.status(201).json({ 
      message: "Signup successful", 
      user: userResponse 
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    console.log('Login request:', req.body);
    
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    // Find user (case-insensitive email)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    console.log('User found:', user.email);
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    console.log('Login successful for:', email);
    
    // Return user without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    res.json({ 
      message: "Login successful", 
      user: userResponse 
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new sport (Admin only)
app.post("/sports", isAdmin, async (req, res) => {
  try {
    const { name, userId } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Sport name is required" });
    }
    
    const newSport = new Sport({ name, createdBy: userId });
    await newSport.save();
    res.status(201).json({ message: "Sport created successfully", sport: newSport });
  } catch (error) {
    console.error('Create sport error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all sports
app.get("/sports", async (req, res) => {
  try {
    const sports = await Sport.find();
    res.json(sports);
  } catch (error) {
    console.error('Get sports error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a sport (Admin only)
app.delete("/sports/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Sport.findByIdAndDelete(id);
    res.json({ message: "Sport deleted successfully" });
  } catch (error) {
    console.error('Delete sport error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create Session
app.post("/sessions", async (req, res) => {
  try {
    console.log('Create session request:', req.body);
    
    const { sport, venue, dateTime, createdBy, teamA, teamB, additionalPlayers } = req.body;
    
    // Validate required fields
    if (!sport || !venue || !dateTime || !createdBy) {
      return res.status(400).json({ message: "Sport, venue, dateTime, and createdBy are required" });
    }
    
    const newSession = new Session({ 
      sport, 
      venue, 
      dateTime, 
      createdBy,
      teamA: teamA || [],
      teamB: teamB || [],
      additionalPlayers: additionalPlayers || 0
    });
    
    await newSession.save();
    console.log('Session created successfully');
    
    res.status(201).json({ message: "Session created successfully", session: newSession });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get Sessions
app.get("/sessions", async (req, res) => {
  try {
    const sessions = await Session.find().populate("createdBy", "name email");
    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Sports Scheduler API is running!" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));