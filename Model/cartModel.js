// var mongoose = require("mongoose");

// var cartSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "users",      // <-- your User model name
//         required: true
//     },

//     items: [
//         {
//             product: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: "product",   // <-- your Product model name
//                 required: true
//             },

//             quantity: {
//                 type: Number,
//                 default: 1
//             }
//         }
//     ]
// });

// var Cart = mongoose.model("cart", cartSchema);

// module.exports = Cart;

const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },

    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",   // <-- IMPORTANT
                required: true
            },

            quantity: {
                type: Number,
                default: 1
            }
        }
    ]
});

module.exports = mongoose.model("Cart", cartSchema);