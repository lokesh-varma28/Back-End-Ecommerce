
var express = require("express")
var router = express.Router()

const validate = require("../MiddleWare/validateMiddleware")
const {
    registerSchema,
    loginSchema,
    verifyOtpSchema,
    resendOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema
} = require("../validation/authValidation")

const {
    registerUser,
    verifyOtp,
    resendOtp,
    login,
    forgotPassword,
    resetPassword,
    refreshTokenController
} = require("../Controller/UserController")

// REGISTER
router.post("/register", validate(registerSchema), registerUser)

// LOGIN
router.post("/login", validate(loginSchema), login)

// VERIFY OTP
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp)

// RESEND OTP
router.post("/resend-otp", validate(resendOtpSchema), resendOtp)

// FORGOT PASSWORD
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword)

// RESET PASSWORD
router.post("/reset-password", validate(resetPasswordSchema), resetPassword)

// REFRESH TOKEN
router.post("/refresh-token", refreshTokenController)

module.exports = router