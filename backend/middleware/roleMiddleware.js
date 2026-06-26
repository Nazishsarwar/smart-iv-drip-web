// backend/middleware/roleMiddleware.js

// Restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — requires one of: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { restrictTo };
