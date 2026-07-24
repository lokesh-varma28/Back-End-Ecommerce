
var jwt = require("jsonwebtoken");

var authMiddleware = async (req, res, next) => {
    try {

        console.log("Authorization Header:", req.headers.authorization);

        var authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "No token found"
            });
        }

        var token = authHeader.split(" ")[1];

        console.log("Received Token:", token);

        var decoded = jwt.verify(token, process.env.JWT_TOKEN);

        console.log("Decoded:", decoded);

        req.user = decoded;

        next();

    } catch (error) {

        console.log("JWT ERROR:", error.message);

        return res.status(401).json({
            message: "Invalid or malformed token"
        });
    }
};

module.exports = authMiddleware;