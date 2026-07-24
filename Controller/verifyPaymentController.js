const crypto = require("crypto");
const { createOrderService } = require("../service/orderService");

// ==============================
// VERIFY ONLINE PAYMENT
// ==============================

const verifyPayment = async (req, res) => {
    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            shippingAddress,
            couponCode,
            discount,
            finalAmount,
             buyNowProductId

        } = req.body;

        const userId = req.user.userId;
        const email = req.user.email;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment Details Missing"
            });
        }

        const body =
            razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment Verification Failed"
            });
        }

        console.log("VERIFY PAYMENT CALLED");

        const order = await createOrderService({
            userId,
            email,
            paymentId: razorpay_payment_id,
            paymentMethod: "ONLINE",
            shippingAddress,
            couponCode,
            discount,
            finalAmount,
             buyNowProductId
        });

        console.log("ORDER CREATED =", order);

        return res.status(200).json({
            success: true,
            message: "Payment Verified Successfully",
            order
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// ==============================
// CASH ON DELIVERY ORDER
// ==============================

const placeCodOrder = async (req, res) => {

    try {

        const {
            shippingAddress,
            couponCode,
            discount,
            finalAmount,
            buyNowProductId
        } = req.body;

        const userId = req.user.userId;
        const email = req.user.email;

        const order = await createOrderService({

            userId,
            email,

            paymentId: "",

            paymentMethod: "COD",

            shippingAddress,

            couponCode,

            discount,

            finalAmount,
            
            buyNowProductId

        });

        return res.status(201).json({

            success: true,

            message: "Cash On Delivery Order Placed Successfully",

            order

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

module.exports = {
    verifyPayment,
    placeCodOrder
};