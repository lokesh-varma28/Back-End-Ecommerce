var User = require("../Model/UserModel")
var bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const transporter = require("../config/nodemailer")
const { generateAccessToken, generateRefreshToken } = require("../helper/token")

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const OTP_EMAIL_TEMPLATE = (otp, subtitle) => `
    <div style="font-family: sans-serif; padding: 20px; background-color: #09090b; color: #ffffff; border-radius: 12px; max-width: 400px; margin: auto; border: 1px solid #27272a;">
        <h2 style="color: #6366f1; margin-bottom: 5px;">HOME STORE</h2>
        <p style="color: #a1a1aa; font-size: 14px;">${subtitle}</p>
        <hr style="border-color: #27272a; margin: 20px 0;"/>
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; display: block; margin-bottom: 8px;">Your Security OTP Code</span>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #ffffff; background-color: #18181b; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #3f3f46;">
            ${otp}
        </div>
        <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 15px;">This OTP is valid for 5 minutes.</p>
    </div>
`

// ==========================================
// 1. REGISTER USER (Account created before OTP verification)
// ==========================================
var registerUser = async (req, res) => {
    try {
        var { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const trimmedEmail = email.trim()

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            })
        }

        var userExists = await User.findOne({ email: trimmedEmail })

        if (userExists) {
            if (!userExists.isVerified) {
                await User.deleteOne({ _id: userExists._id })
            } else {
                return res.status(400).json({
                    message: "User already exists with this email"
                })
            }
        }

        const hashPassword = await bcrypt.hash(password, 10)
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedOtp = await bcrypt.hash(otp, 10)
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000)

        await User.create({
            name: name.trim(),
            email: trimmedEmail,
            password: hashPassword,
            otp: hashedOtp,
            otpExpires,
            otpLastSent: new Date(),
            otpAttempts: 0,
            isVerified: false
        })

        try {

    await transporter.sendMail({
        from: process.env.EMAIL,
        to: trimmedEmail,
        subject: "HOME STORE - Email Verification OTP",
        html: OTP_EMAIL_TEMPLATE(
            otp,
            "Verify your account to complete registration."
        )
    })

    console.log("OTP Email Sent")

} catch (mailError) {

    console.log("MAIL ERROR")
    console.log(mailError)

    return res.status(500).json({
        message: "Email sending failed",
        error: mailError.message
    })
}

        res.status(201).json({
            message: "Account created. OTP sent to email.",
            email: trimmedEmail
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Registration failed"
        })
    }
}

// ==========================================
// 2. VERIFY OTP
// ==========================================
var verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            })
        }

        const user = await User.findOne({ email: email.trim() })

        if (!user) {
            return res.status(404).json({
                message: "User not found. Please register first."
            })
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: "Email is already verified"
            })
        }

        if (user.otpAttempts >= 3) {
            return res.status(429).json({
                message: "Too many failed attempts. Please resend a new OTP."
            })
        }

        if (!user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({
                message: "OTP expired. Please request a new one."
            })
        }

        const validOtp = await bcrypt.compare(otp, user.otp)

        if (!validOtp) {
            user.otpAttempts += 1
            await user.save()
            return res.status(400).json({
                message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.`
            })
        }

        user.isVerified = true
        user.otp = undefined
        user.otpExpires = undefined
        user.otpAttempts = 0
        await user.save()

        res.status(200).json({
            message: "Email verified successfully"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Verification failed"
        })
    }
}

// ==========================================
// 3. RESEND OTP
// ==========================================
var resendOtp = async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            })
        }

        const user = await User.findOne({ email: email.trim() })

        if (!user) {
            return res.status(404).json({
                message: "User not found. Please register first."
            })
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: "Email is already verified"
            })
        }

        const now = new Date()
        if (user.otpLastSent && now - user.otpLastSent < 60000) {
            return res.status(429).json({
                message: "Please wait 60 seconds before requesting another OTP"
            })
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedOtp = await bcrypt.hash(otp, 10)
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000)

        user.otp = hashedOtp
        user.otpExpires = otpExpires
        user.otpLastSent = now
        user.otpAttempts = 0
        await user.save()

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email.trim(),
            subject: "HOME STORE - Resend OTP",
            html: OTP_EMAIL_TEMPLATE(otp, "Your requested new authorization code.")
        })

        res.status(200).json({
            message: "New OTP sent successfully"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Resend OTP failed"
        })
    }
}

// ==========================================
// 4. LOGIN
// ==========================================
var login = async (req, res) => {
    try {
        var { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        var userExists = await User.findOne({ email: email.trim() })

        if (!userExists) {
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }

        if (!userExists.isVerified) {
            return res.status(401).json({
                message: "Please verify your email address first"
            })
        }

        if (userExists.lockUntil && userExists.lockUntil > new Date()) {
            return res.status(403).json({
                message: "Account temporarily locked. Try again later."
            })
        }

        var checkPassword = await bcrypt.compare(password, userExists.password)

        if (!checkPassword) {
            userExists.loginAttempts += 1

            if (userExists.loginAttempts >= 5) {
                userExists.lockUntil = new Date(Date.now() + 15 * 60 * 1000)
            }

            await userExists.save()

            return res.status(401).json({
                message: "Invalid credentials"
            })
        }

        userExists.loginAttempts = 0
        userExists.lockUntil = undefined
        await userExists.save()

        const accessToken = generateAccessToken(userExists)
        const refreshToken = generateRefreshToken(userExists)

        res.status(200).json({

    message: "Login successful",

    token: accessToken,

    refreshToken,

    user: {

        _id: userExists._id,

        name: userExists.name,

        email: userExists.email,

        role: userExists.role

    }

});

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Login failed"
        })
    }
}

// ==========================================
// 5. REFRESH TOKEN
// ==========================================
var refreshTokenController = async (req, res) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token required"
            })
        }

        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (error, decoded) => {
                if (error) {
                    return res.status(403).json({
                        message: "Invalid refresh token"
                    })
                }

                const user = await User.findById(decoded.userId)

                if (!user) {
                    return res.status(404).json({
                        message: "User not found"
                    })
                }

                const newAccessToken = generateAccessToken(user)

                res.status(200).json({
                    accessToken: newAccessToken
                })
            }
        )

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Refresh failed"
        })
    }
}

// ==========================================
// 6. FORGOT PASSWORD
// ==========================================
var forgotPassword = async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            })
        }

        const user = await User.findOne({ email: email.trim() })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        const resetOtp = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedResetOtp = await bcrypt.hash(resetOtp, 10)
        const resetOtpExpires = new Date(Date.now() + 5 * 60 * 1000)

        user.resetOtp = hashedResetOtp
        user.resetOtpExpires = resetOtpExpires
        await user.save()

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email.trim(),
            subject: "HOME STORE - Password Reset OTP",
            html: OTP_EMAIL_TEMPLATE(resetOtp, "Use this code to reset your password.")
        })

        res.status(200).json({
            message: "Reset OTP sent"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Forgot password failed"
        })
    }
}

// ==========================================
// 7. RESET PASSWORD
// ==========================================
var resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: "Email, OTP, and new password are required"
            })
        }

        const user = await User.findOne({ email: email.trim() })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        if (!user.resetOtpExpires || user.resetOtpExpires < new Date()) {
            return res.status(400).json({
                message: "OTP expired"
            })
        }

        const validOtp = await bcrypt.compare(otp, user.resetOtp)

        if (!validOtp) {
            return res.status(400).json({
                message: "Invalid OTP"
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        user.resetOtp = undefined
        user.resetOtpExpires = undefined
        await user.save()

        res.status(200).json({
            message: "Password reset successful"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Reset password failed"
        })
    }
}

module.exports = {
    registerUser,
    verifyOtp,
    resendOtp,
    refreshTokenController,
    login,
    forgotPassword,
    resetPassword
}
