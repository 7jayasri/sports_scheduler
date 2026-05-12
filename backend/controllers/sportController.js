import Sport from "../models/Sport.js";

export const createSport = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can create sports" });
  }

  try {
    const sport = await Sport.create({ name: req.body.name, createdBy: req.user._id });
    res.status(201).json(sport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSports = async (req, res) => {
  try {
    const sports = await Sport.find();
    res.json(sports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
