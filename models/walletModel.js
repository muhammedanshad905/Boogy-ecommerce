const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        
        unique: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'failed'],
        default: 'completed'
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'net_banking', 'wallet','Razorpay'],
        required: true
    }
});

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transactions: [transactionSchema],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

walletSchema.methods.addTransaction = async function(transaction) {
    this.transactions.push(transaction);

    if (transaction.type === 'credit') {
        this.balance += transaction.amount;
    } else if (transaction.type === 'debit') {
        this.balance -= transaction.amount;
    }

    this.lastUpdated = Date.now();
    await this.save();
};

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
