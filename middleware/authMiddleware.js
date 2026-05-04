const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");
      
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
};

const admin = (req, res, next) => {
  console.log("User Role Check:", req.user ? req.user.role : "No User");

  if (req.user && String(req.user.role).toLowerCase() === "admin") {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: "Access denied. Admins only!" 
    });
  }
};

module.exports = { protect, admin };
