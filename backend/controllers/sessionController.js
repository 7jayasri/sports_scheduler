import Session from "../models/Session.js";

// Create a session
export const createSession = async (req, res) => {
  try {
    const session = await Session.create({
      sport: req.body.sport,
      creator: req.user._id,
      teamPlayers: req.body.teamPlayers,
      additionalPlayersNeeded: req.body.additionalPlayersNeeded,
      venue: req.body.venue,
      dateTime: req.body.dateTime
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get available sessions
export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ status: "active", dateTime: { $gte: new Date() } })
      .populate("sport")
      .populate("creator", "name email");
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Join session
export const joinSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.joinedPlayers.includes(req.user._id)) {
      return res.status(400).json({ message: "Already joined" });
    }

    session.joinedPlayers.push(req.user._id);
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel session
export const cancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (String(session.creator) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only creator can cancel" });
    }

    session.status = "cancelled";
    session.cancellationReason = req.body.reason;
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
