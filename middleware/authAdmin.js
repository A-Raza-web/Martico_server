const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Also check for adminToken as fallback for session-based auth
      if (req.headers['x-admin-token'] === process.env.ADMIN_TOKEN) {
        req.user = user;
        return next();
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized" });
    }
  } else {
    res.status(401).json({ message: "No token" });
  }
};

module.exports = authAdmin;