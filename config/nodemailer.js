
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// transporter.verify((err, success) => {
//     if (err) {
//         console.log("SMTP ERROR:", err);
//     } else {
//         console.log("SMTP READY");
//     }
// });

module.exports = transporter;