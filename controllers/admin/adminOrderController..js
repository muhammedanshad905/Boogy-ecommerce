const Cart = require('../../models/cartModel');
const Product=require('../../models/prductmodel/productmodel')
const Address=require('../../models/addressModel')
const Order=require('../../models/orderModel')

const loadOrderlist=async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit =parseInt(req.query.limit) ||5; // Number of items per page
        const skip = (page - 1) * limit;

        const order=await Order.find().skip(skip).limit(limit).sort({createdAt:-1})        
        const totalorders=await Order.countDocuments()
        const totalPages=Math.ceil(totalorders/limit)

        res.render('orderListing',{
            order,
            totalPages,
            currentPage:page,
        })
    } catch (error) {
        console.log(error);
        
    }
}
                                                     
const updateOrderStatus = async (req, res, next) => {
    try {
        
        const { orderId, itemId, newStatus } = req.body;
        const order = await Order.findById(orderId)
        const item = order.orderedItems.find(item => item._id.toString() === itemId);
        item.orderStatus = newStatus;
        const updatedOrder = await order.save();
        if (updatedOrder) {
            res.json({ success: true, message: "Order status updated successfully" });
        } else {
            res.json({ success: false, message: "Order not found" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Server error" });
        next(error)
    }
}

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
const adminOrderDetails=async(req,res)=>{
    try {
        const {orderId}= req.query
        
        if(!orderId){
            return res.status(400).send('orderId is required')
        }
        const order=await Order.findById(orderId)
        .populate('orderedItems')
        if(!order){
            return res.render('orderNotFound')
        }
        const orderedItems=order.orderedItems;
        console.log(orderedItems,'orderditems');
        
        const orders = await Order.findById(orderId)

        const subtotal=calculateSubtotal(orderedItems)
        const grandTotal=calculateGrandTotal(orderedItems)
        res.render('adminOrderDetails',{
            order:orderedItems,
            subtotal,
            grandTotal,
            orders,
            orderId:order.orderId,
            shippingAddress:order.shippingAddress || {},
        })
    } catch (error) {
        console.log(error)
    }
}


module.exports={
    loadOrderlist,
    updateOrderStatus,
    adminOrderDetails
}