const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = new Schema({
    offerName: {
        type: String,
        required: true,
    },
    offerType: {
        type: String,
        enum: ['product', 'category'],
        required: true,
    },
    productOffer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required: function() {
            return this.offerType === 'product';
        },
        default:null
    },
    categoryOffer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: function() {
            return this.offerType === 'category';
        },
        default:null
    },
    discountPercentage: {
        type: Number,
        required: true,
    },
    maxRedeem: {
        type: Number,
        required: true,
    },
    offerDescription: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isListed: { 
    type: Boolean,
    default: true 
    } 
});

// Validation to ensure only one of productOffer or categoryOffer is populated
offerSchema.pre('save', function(next) {
    if (this.offerType === 'product' && !this.productOffer) {
        return next(new Error('Product offer is required for product type offers'));
    }
    if (this.offerType === 'category' && !this.categoryOffer) {
        return next(new Error('Category offer is required for category type offers'));
    }
    if (this.productOffer && this.categoryOffer) {
        return next(new Error('Only one of productOffer or categoryOffer should be populated'));
    }
    next();
});

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
