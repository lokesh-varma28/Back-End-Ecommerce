// var jwt = require("jsonwebtoken")

// var authMiddleware = async(req,res,next)=>{
//     try{
//         var authHeader = req.headers.authorization
//         if(!authHeader){
//             return res.status(401).json({message : "no token found"})
//         }
//         var parts = authHeader.split(" ")
//         if (parts.length < 2 || !parts[1]) {
//             return res.status(401).json({ message: "use Authorization: Bearer <token>" })
//         }
//         var token = parts[1]
//         var decode = jwt.verify(token,process.env.JWT_TOKEN)
//         req.user = decode
//         next()

//     }catch(error){
//         return res.status(401).json({
//             message: "Invalid or malformed token"
//         });
//     }
// }

// module.exports = authMiddleware




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