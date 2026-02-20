import jwt from "jsonwebtoken";

const auth = (role) => {
  return (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access denied" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (role && decoded.role !== role) {
        return res.status(403).json({ message: "Unauthorized role" });
      }

      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ message: "Invalid token" });
    }
  };
};

export default auth;
