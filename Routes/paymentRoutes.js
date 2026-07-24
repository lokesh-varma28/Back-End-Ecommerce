// var express = require("express")

// var authMiddleware = require("../MiddleWare/authMiddleware")
// var { checkout } = require("../Controller/paymentController")
// var { verifyPayment } = require("../Controller/verifyPaymentController")

// var router = express.Router()

// router.post("/checkout", authMiddleware, checkout)
// router.post("/verify-payment", authMiddleware, verifyPayment)

// module.exports = router
const express = require("express");

const { checkout } = require("../Controller/paymentController");

const {
    verifyPayment,
    placeCodOrder
} = require("../Controller/verifyPaymentController");

const authMiddleware = require("../MiddleWare/authMiddleware");

const router = express.Router();

router.post("/checkout", authMiddleware, checkout);

router.post("/verify-payment", authMiddleware, verifyPayment);

// router.post("/cod-order", authMiddleware, placeCodOrder);
router.post("/cod", authMiddleware, placeCodOrder);

module.exports = router;