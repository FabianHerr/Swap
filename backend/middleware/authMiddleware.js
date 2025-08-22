const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {

    const authHeader = req.headers["authorization"]; // Get Authorization header from request

    const token = authHeader && authHeader.split(" ")[1]; // Extract token from Authorization header
    //.split(" ") is used since the authorization header has the form 'bearer <token>', we use [1] to get the token part.

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request object
        next(); // Call the next middleware or route handler
    } catch (error) {
        return res.status(403).json({ success: false, message: "Invalid token" });
    }
}