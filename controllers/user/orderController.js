const mongoose=require('mongoose')
const User=require('../../models/login/userschema')
const Address=require('../../models/addressModel')
const Cart=require('../../models/cartModel')
const Product =require('../../models/prductmodel/productmodel')
const Category=require('../../models/categorymodel')
const Order=require('../../models/orderModel')
const Wallet= require('../../models/walletModel')
const Razorpay = require('razorpay')
const PDFDocument = require('pdfkit');


function calculateSubtotal(order) {
    let subtotal = 0;
    order.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    return subtotal.toFixed(2); 
}

function calculateGrandTotal(order) {
    let subtotal = calculateSubtotal(order);
    let tax = 4.87;
    let discount = 0.00;
    let shipping = 5.00; 

    let grandTotal = parseFloat(subtotal) + tax - discount + shipping;
    return grandTotal.toFixed(2);
}


const loadOrdersuccess=async(req,res)=>{
    try {
        
        
        const {orderId}= req.query
        
        if(!orderId){
            return res.status(400).send('orderId is required')
        }
        const order=await Order.findById(orderId)
        .populate('orderedItems')
        const orderedItems=order.orderedItems;
        const orders = await Order.findById(orderId)

        const subtotal=calculateSubtotal(orderedItems)
        const grandTotal=calculateGrandTotal(orderedItems)
        
        res.render('orderSuccess',{
            order:orderedItems,
            subtotal,
            grandTotal,
            orders,
            orderId:order.orderId,
            shippingAddress:order.shippingAddress || {},
        })
    } catch (error) {
        console.log(error);
    }
}
const loadOrderHistory=async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit =parseInt(req.query.limit) ||5; // Number of items per page
        const skip = (page - 1) * limit;

       const order=await Order.find({userId:req.session.user_id}).skip(skip).limit(limit).sort({createdAt:-1})
       const totalorders = await Order.countDocuments({userId:req.session.user_id});

       const totalPages=Math.ceil(totalorders/limit)
        res.render('orderHistoryManage',{
            order,
            totalPages,
            currentPage:page
        })
    } catch (error) {
        console.log(error);
        
    }
}

const cancelOrder=async(req,res)=>{
    try {        
        const  {orderId,itemId}=req.body
        const order = await Order.findById(orderId)
        const item = order.orderedItems.find(item => item._id.toString() === itemId);
        item.orderStatus = 'Canceled';
        const updatedOrder = await order.save();
        if(order.paymentMethod == 'Razorpay'){
            
            const wallet = await Wallet.findOne({ user: req.session.user_id });

            if (!wallet) {                
                return res(400).json({ success: false, message: "Wallet not found" });
            }

            const price = item.price;
            const transaction = {               
                transactionId : '',
                type: 'credit',
                amount: price,
                description: 'Funds added to wallet due to order cancellation',
                paymentMethod: 'Razorpay'
            };
            
            wallet.transactions.push(transaction);
            wallet.balance += transaction.amount;            

            await wallet.save();
            
        }
        if(updatedOrder){
            res.json({success:true})
        }else{
            res.json({success:false})
        }
    } catch (error) {
        console.log(error);
        res.json({success:false})
        
    }
}

const returnOrder= async (req, res) => {
    const { orderId, itemId } = req.body;

    try {
        const order = await Order.findById(orderId);
        const item = order.orderedItems.id(itemId);

        if (!order || !item) {
            return res.status(404).json({ success: false, message: 'Order or item not found' });
        }

        item.orderStatus = 'Returned';
        const updateOrder=await order.save();

        if(order.paymentMethod === 'Razorpay'){
            const wallet = await Wallet.findOne({user:req.session.user_id})
            if(!wallet){
                res.status(404).json({message:'wallet not found'})
            }
            const price = item.price;
            const transaction = {
                transactionId: '', // You can generate a unique transaction ID here if needed
                type: 'credit',
                amount: price,
                description: 'Funds added to wallet due to order return',
                paymentMethod: 'Razorpay'
            };
            wallet.transactions.push(transaction)
            wallet.balance += transaction.amount

            await wallet.save()
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error processing return request:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const razorpayFailure = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID not found' });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.orderStatus = 'Pending';
        order.paymentStatus = 'Pending';
        await order.save();

        res.status(200).json({ success: true, message: 'Payment failure recorded. You can retry payment.' });
    } catch (error) {
        console.error('Payment failure error:', error);
        return res.status(500).json({ success: false, error: 'Failed to record payment failure.' });
    }
};

const paymentFailure = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID not found' });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.orderStatus = 'Pending';
        order.paymentStatus = 'Paid';
        await order.save();

        res.status(200).json({ success: true, message: 'Payment failure recorded. You can retry payment.' });
    } catch (error) {
        console.error('Payment failure error:', error);
        return res.status(500).json({ success: false, error: 'Failed to record payment failure.' });
    }
};

const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID not found' });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }        

        if (order.paymentStatus === 'Paid') {
            return res.status(400).json({ message: 'Payment for this order has already been completed.' });
        }
        const options = {
            amount: order.totalAmount * 100, 
            currency: 'INR',
            receipt: `retry_receipt_order_${Date.now()}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        order.paymentDetails = {
            orderId: razorpayOrder.id,
            paymentId: null,
            signature: null,
        };

        return res.json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            orderId: order._id, 
        });
    } catch (error) {
        console.error('Error retrying payment:', error);
        res.status(500).json({ success: false, error: 'Failed to retry payment.' });
    }
};



const loadOrderDetails=async(req,res)=>{
    try {
        const {orderId}= req.query
        
        if(!orderId){
            return res.status(400).send('orderId is required')
        }
        const order=await Order.findById(orderId)
        .populate('orderedItems')
        const orderedItems=order.orderedItems;
        const orders = await Order.findById(orderId)

        const subtotal=calculateSubtotal(orderedItems)
        const grandTotal=calculateGrandTotal(orderedItems)
        
        res.render('orderDetails',{
            order:orderedItems,
            subtotal,
            grandTotal,
            orders,
            orderId:order.orderId,
            shippingAddress:order.shippingAddress || {},
        })
    } catch (error) {
        
    }
}



const loadInvoice = async (req, res) => {
    try {
        const { orderId, itemId } = req.query; 

        if (!orderId || !itemId) {
            return res.status(400).send('orderId and itemId are required');
        }

        const order = await Order.findById(orderId).populate('orderedItems.productId');

        const item = order.orderedItems.find(item => item._id.toString() === itemId);
        if (!item) {
            return res.status(404).send('Item not found in the order');
        }

        const subtotal = calculateSubtotal([item]); 
        const grandTotal = calculateGrandTotal([item]); 

        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${String(orderId)}_${String(itemId)}.pdf`);

        doc.pipe(res);

        doc.fontSize(20).text('Invoice', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12);

        doc.text(`Order ID: ${orderId}`);
        doc.text(`Order Date: ${order.createdAt.toDateString()}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.moveDown();

        doc.moveDown();
        doc.text('Shipping Address:');
        doc.text(`Name: ${order.address.firstname} ${order.address.lastname}`);
        doc.text(`Street: ${order.address.street}`);
        doc.text(`City: ${order.address.city}`);
        doc.text(`State: ${order.address.state}`);
        doc.text(`Postal Code: ${order.address.postalCode}`);
        doc.text(`Phone: ${order.address.phone}`);
        doc.text(`Email: ${order.address.email}`);
        doc.moveDown();

        doc.text('Ordered Item:');
        doc.text(`ProductName: ${item.productName} `);
        doc.text(`Quantity: ${item.quantity}`)
        doc.moveDown();
        doc.text(`Subtotal: $${subtotal}`);
        doc.text(`Grand Total: $${grandTotal}`);

        doc.end();        
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};



module.exports={
    loadOrdersuccess,
      loadOrderHistory,
      cancelOrder,
      loadOrderDetails,
      returnOrder,
      loadInvoice,
      razorpayFailure,
      retryPayment,
      paymentFailure 
}
