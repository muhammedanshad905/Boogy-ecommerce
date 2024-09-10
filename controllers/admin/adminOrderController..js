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

module.exports={
    loadOrderlist,
    updateOrderStatus,
}