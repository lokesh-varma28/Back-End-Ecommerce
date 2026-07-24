require("dotenv").config()

const express = require("express")
const app = express() // MUST BE FIRST
const cors = require("cors")
const cookieParser = require("cookie-parser")
const helmet = require("helmet")

const connectToDatabase = require("./DataBase/db.js")
const { connectRedis } = require("./config/redisClient.js")
const { createLimiters } = require("./MiddleWare/rateLimiter.js")
const authLimiter = require("./MiddleWare/authLimiter")

// routes
const userRoutes = require("./Routes/UserRoutes.js")
const productRoutes = require("./Routes/ProductRoutes.js")
const profileRoutes = require("./Routes/profileRoutes.js")
const cartRoutes = require("./Routes/cartRoutes.js")
const paymentRoutes = require("./Routes/paymentRoutes.js")
const orderRoutes = require("./Routes/orderRoutes.js")
const wishlistRoutes = require("./Routes/wishlistRoutes.js")
const promoRoutes = require("./Routes/promoRoutes.js")
const couponRoutes = require("./Routes/couponRoutes")
const trackingRoutes = require("./Routes/trackingRoutes")
const addressRoutes = require("./Routes/addressRoutes")
const adminRoutes = require("./Routes/adminRoutes");
const reviewRoutes = require("./Routes/reviewRoutes");
const questionRoutes = require("./Routes/questionRoutes");
const searchRoutes = require("./Routes/searchRoutes");
const recommendationRoutes = require("./Routes/recommendationRoutes");
const invoiceRoutes = require("./Routes/invoiceRoutes");
const analyticsRoutes = require("./Routes/analyticsRoutes");
const returnRoutes = require("./Routes/returnRoutes");
const inventoryRoutes = require("./Routes/inventoryRoutes");
const notificationRoutes = require("./Routes/notificationRoutes");
const categoryRoutes = require("./Routes/categoryRoutes");
const brandRoutes = require("./Routes/brandRoutes");
const googleAuthRoutes = require("./Routes/googleAuthRoutes");

// middleware setup
app.use(cookieParser())

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

app.use(
    cors({
        origin: true,
        credentials: true,
        exposedHeaders: ["Content-Disposition"],
    })
);

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
    res.json({ message: "API running" })
})

// IMPORTANT: trust proxy BEFORE rate limiter
app.set("trust proxy", 1)

const startServer = async () => {

    await connectRedis()

    const { productLimiter, adminLimiter } = createLimiters()

    app.use("/products", productLimiter, productRoutes)
    app.use("/admin", adminLimiter)

    app.use("/", authLimiter, userRoutes)
    app.use("/", profileRoutes)
    app.use("/", cartRoutes)
    app.use("/payment", paymentRoutes)
    app.use("/", orderRoutes)
    app.use("/", wishlistRoutes)
    app.use("/", promoRoutes)
    app.use("/", couponRoutes)
    app.use("/", trackingRoutes)
    app.use("/", reviewRoutes);
    app.use("/", questionRoutes);
    app.use("/", searchRoutes);
    app.use("/", recommendationRoutes);
    app.use("/", invoiceRoutes);
    app.use("/admin", analyticsRoutes);
    app.use("/", addressRoutes)
    app.use("/admin", adminRoutes);
    app.use("/", returnRoutes);
    app.use("/admin", inventoryRoutes);
    app.use("/", notificationRoutes);
    app.use("/", categoryRoutes);
    app.use("/", brandRoutes);
    app.use("/auth", googleAuthRoutes); // Google OAuth

    await connectToDatabase()

    app.listen(process.env.PORT, () => {
        console.log("Server running on port", process.env.PORT)
    })
}

startServer()
