const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    paymentStatus: {
        type: String,
        default: 'Pending',
        required: true
    },

    orderedItems: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Products",
            required: true
        },
    
        productName: {
            type: String,
            required: true
        },
        productImage: [
            {
                type: String,
            },
        ],
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        }, 
        orderStatus: {
            type: String,
            default: 'Pending',
        },
      
        orderDate: {
            type: Date,
            default: Date.now
        },
        confirmedDate: Date,
        shippedDate: Date,
        deliveredDate: Date,
        cancelledDate: {
            type: Date,
            default: null
        }
    }],

    paymentMethod: {
        type: String,
        enum: ['cashOnDelivery', 'Razorpay', 'wallet'],
        required: true
    },

    razorpayDetails: {
        orderId: String,
        paymentId: String,
        signature: String
    },

    address: {
        firstname: {
            type: String,
            required: true
        },
        lastname: {
            type: String,
            required: true
        },
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        phone: {
            type: Number,
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },

    orderStatus: {
        type: String,
        default: 'Pending',
        required: true
    },
    
    totalAmount: {
        type: Number,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("orders", orderSchema);
