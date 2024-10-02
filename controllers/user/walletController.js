const Wallet = require('../../models/walletModel')
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});



const loadWallet = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const itemsPerPage = 5; // Number of transactions per page

        let wallet = await Wallet.findOne({ user: userId });
        
        if (!wallet) {
            wallet = new Wallet({
                user: userId
            });
            await wallet.save();
        }

        // Pagination logic
        const totalTransactions = wallet.transactions.length;
        const totalPages = Math.ceil(totalTransactions / itemsPerPage);
        const paginatedTransactions = wallet.transactions
            .slice((page - 1) * itemsPerPage, page * itemsPerPage) // Paginate the transactions
            .reverse();

        res.render('wallet', { 
            wallet, 
            transactions: paginatedTransactions, 
            currentPage: page, 
            totalPages 
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error loading wallet');
    }
};


const createOrder = async (req, res) => {
    const { amount } = req.body;

    const options = {
        amount: parseInt(amount),  // Ensure amount is an integer in paise
        currency: "INR",
        receipt: "order_rcptid_11"
    };

    try {
        const order = await razorpayInstance.orders.create(options);
        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.json({ success: false, error: error.message });
    }
};


const verifyPayments = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature,amount } = req.body;

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
        try {
            const userId=req.session.user_id
            console.log(userId,'userId is here');
            
            const wallet = await Wallet.findOne({ user:userId});

            if (!wallet) {
                return res.status(404).json({ success: false, message: 'Wallet not found' });
            }

            const transaction = {
                transactionId: razorpay_payment_id,
                type: 'credit',
                amount: parseFloat(amount) / 100, 
                description: 'Funds added to wallet',
                paymentMethod: 'Razorpay' 
            };
            wallet.transactions.push(transaction);
            wallet.balance += transaction.amount;
            
            await wallet.save()

            res.json({ success: true });
        } catch (error) {
            console.error('Error verifying payment:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    } else {
        res.json({ success: false, message: 'Payment verification failed' });
    }
};


module.exports={
    loadWallet,
    createOrder,
    verifyPayments

}


