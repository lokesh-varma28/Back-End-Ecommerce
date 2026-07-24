// const rateLimit =
// require("express-rate-limit")

// const authLimiter = rateLimit({

//     windowMs:  60 * 1000,

//     max:10,

//     message:{

//         message:
//         "Too many requests. Try later."
//     }
// })

// module.exports = authLimiter

const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 5000, // ✅ FIX: Limit 
    message: {
        message: "Too many requests. Try later."
    }
});

module.exports = authLimiter;