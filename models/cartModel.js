const mongoose = require('mongoose');

const cartSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Ensure you have a User model
    },
    cartItems: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Products',
            },
            offerId: { // Field to store offer reference
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Offer',
                default: null, // Default to null if no offer is applied
            },
            productName: {
                type: String,
            },
         
            price: {
                type: Number,
                required: true, // Ensure price is provided
            },
            offerPrice: { // Store price with offer applied if needed
                type: Number,
                default: null,
            },
            quantity: {
                type: Number,
                default: 1,
            },
            
        },
    ],
});

module.exports = mongoose.model('Cart', cartSchema);
