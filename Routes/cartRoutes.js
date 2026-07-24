// // const express = require("express");
// // const router = express.Router();

// // const authMiddleware = require("../MiddleWare/authMiddleware");


// // const {
// //     getCart,
// //     addToCart,
// //     decreaseCartQuantity,
// //     removeCartItem
// // } = require("../Controller/cartController");


// // router.get("/cart", getCart);
// // // router.post("/add-cart", addToCart);
// // router.patch("/decrease-cart", decreaseCartQuantity);
// // router.delete("/remove-cart", removeCartItem);

// // module.exports = router;


// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../MiddleWare/authMiddleware");

// const {
//     getCart,
//     addToCart,
//     decreaseCartQuantity,
//     removeCartItem
// } = require("../Controller/cartController");

// // =======================
// // GET USER CART
// // =======================
// router.get(
//     "/cart",
//     authMiddleware,
//     getCart
// );

// // =======================
// // ADD PRODUCT TO CART
// // =======================
// router.post(
//     "/add-cart",
//     authMiddleware,
//     addToCart
// );

// // =======================
// // DECREASE PRODUCT QUANTITY
// // =======================
// router.patch(
//     "/decrease-cart",
//     authMiddleware,
//     decreaseCartQuantity
// );

// // =======================
// // REMOVE PRODUCT FROM CART
// // =======================
// router.delete(
//     "/remove-cart",
//     authMiddleware,
//     removeCartItem
// );

// module.exports = router;



const express = require("express");
const router = express.Router();

const authMiddleware = require("../MiddleWare/authMiddleware");

const {
    getCart,
    addToCart,
    decreaseCartQuantity,
    removeCartItem
} = require("../Controller/cartController");

// Get Cart
router.get("/cart", authMiddleware, getCart);

// Add Item
router.post("/cart", authMiddleware, addToCart);

// Decrease Quantity
router.put("/cart/decrease", authMiddleware, decreaseCartQuantity);

// Remove Item
router.delete("/cart", authMiddleware, removeCartItem);

module.exports = router;