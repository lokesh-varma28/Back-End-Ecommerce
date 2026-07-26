const mongoose = require("mongoose");

const Cart = require("../Model/cartModel");
const Product = require("../Model/ProductModel");
const Order = require("../Model/orderModel");
const Coupon = require("../Model/couponModel");

const sendEmail = require("../helper/sendEmail");

const createOrderService = async ({

    userId,

    email,

    paymentId = "",

    paymentMethod = "COD",

    shippingAddress,

    couponCode = "",

    discount = 0,

    finalAmount = 0,

    buyNowProductId = null

}) => {

    const session = await mongoose.startSession();

    session.startTransaction();

    try {

        let items = [];
        let total = 0;

        // ===========================
        // BUY NOW
        // ===========================

        if (buyNowProductId) {

            const product = await Product.findById(buyNowProductId).session(session);

            if (!product) {
                throw new Error("Product Not Found");
            }

            if (product.stock < 1) {
                throw new Error("Product Out Of Stock");
            }

            product.stock -= 1;

            await product.save({ session });

            items.push({

                product: product._id,

                quantity: 1,

                price: product.price

            });

            total = product.price;

        }

        // ===========================
        // CART CHECKOUT
        // ===========================

        else {

            const cart = await Cart.findOne({
                user: userId
            }).session(session);

            if (!cart || cart.items.length === 0) {
                throw new Error("Cart Is Empty");
            }

            for (const item of cart.items) {

                const product = await Product.findById(item.product).session(session);

                if (!product) {
                    throw new Error("Product Not Found");
                }

                if (product.stock < item.quantity) {
                    throw new Error(`${product.title} is Out Of Stock`);
                }

                product.stock -= item.quantity;

                await product.save({ session });

                items.push({

                    product: product._id,

                    quantity: item.quantity,

                    price: product.price

                });

                total += product.price * item.quantity;

            }

        }

        // ===========================
        // FINAL AMOUNT
        // ===========================

        let finalTotal = total;

        if (discount > 0) {
            // Use the pre-calculated finalAmount from client if provided,
            // otherwise compute it. Never go below 0.
            finalTotal = (finalAmount > 0 ? finalAmount : total - discount);
            if (finalTotal < 0) finalTotal = 0;
        }

        // ===========================
        // CREATE ORDER
        // ===========================

        const order = await Order.create([{

            userId,

            items,

            totalAmount: total,

            couponCode,

            discount,

            finalAmount: finalTotal,

            paymentId,

            paymentMethod,

            paymentStatus:
                paymentMethod === "ONLINE"
                    ? "Paid"
                    : "Pending",

            shippingAddress,

            status: "confirmed"

        }], { session });

        // ===========================
        // UPDATE COUPON
        // ===========================

        if (couponCode) {

            await Coupon.findOneAndUpdate(

                {
                    code: couponCode.toUpperCase()
                },

                {
                    $inc: {
                        usedCount: 1
                    }
                },

                {
                    session
                }

            );

        }

        // ===========================
        // CLEAR CART
        // ===========================

        if (!buyNowProductId) {

            await Cart.findOneAndUpdate(

                {
                    user: userId
                },

                {
                    $set: {
                        items: []
                    }
                },

                {
                    session
                }

            );

        }

        await session.commitTransaction();

        session.endSession();

        // ===========================
        // SEND EMAIL
        // ===========================

        if (email) {

            await sendEmail(

                email,

                "Order Confirmed",

                `
                <h2>Order Confirmed ✅</h2>

                <p><b>Order ID:</b> ${order[0]._id}</p>

                <p><b>Total:</b> ₹${order[0].finalAmount}</p>

                <p><b>Payment:</b> ${order[0].paymentMethod}</p>

                <p><b>Status:</b> ${order[0].status}</p>

                <br/>

                <h3>Thank you for shopping ❤️</h3>
                `

            );

        }

        return order[0];

    }

    catch (err) {

        await session.abortTransaction();

        session.endSession();

        throw err;

    }

};

module.exports = {

    createOrderService

};