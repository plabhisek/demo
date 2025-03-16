// Middleware for checking user roles
const checkRole = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied: insufficient permissions' });
      }
      
      next();
    };
  };
  
  // Shorthand middleware for admin-only routes
  const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: admin privileges required' });
    }
    
    next();
  };
  
  module.exports = {
    checkRole,
    isAdmin
  };