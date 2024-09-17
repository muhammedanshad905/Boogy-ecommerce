const Coupon=require('../../models/couponModel')
const Order=require('../../models/orderModel')

const loadCoupon=async(req,res)=>{
    try {
        const coupon= await Coupon.find({})
        res.render('couponManagement',{coupon})
    } catch (error) {
        console.log(error);
        
    }
}

const addCoupon=async(req,res)=>{
    try {
        const {couponCode,couponDescription,couponDiscount,couponMinPurchase,couponRedeemAmount,couponExpiry} =req.body        

        let newCoupon=new Coupon({
            couponCode:couponCode,
            couponDescription:couponDescription,
            couponDiscount: couponDiscount,
            couponMinPurchase: couponMinPurchase,
            couponRedeemAmount:couponRedeemAmount,
            couponExpiry:couponExpiry
        })
        await newCoupon.save()
        res.status(200).json({message:'coupon added successfuly'})
    } catch (error) {
        console.log(error);
        
        res.status(500).json({message:'somthing wrong'})
    }
}
const editCoupon = async (req, res) => {
    try {
        const {
            couponId, 
            editCouponCode,
            editCouponDescription,
            editCouponDiscount,
            editCouponMinPurchase,
            editCouponRedeemAmount,
            editCouponExpiry
        } = req.body;
        

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            couponId,
            {
                couponCode : editCouponCode,
                couponDescription : editCouponDescription,
                couponDiscount :  editCouponDiscount,
                couponMinPurchase : editCouponMinPurchase,
                couponRedeemAmount : editCouponRedeemAmount,
                couponExpiry : editCouponExpiry 
            },
            { new: true } 
        );
        
        if (!updatedCoupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.status(200).json({ message: 'Coupon updated successfully', updatedCoupon });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCoupon = await Coupon.findByIdAndDelete(id);

        if (!deletedCoupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};
const applyCoupon = async (req, res, next) => {
    try {
        const { couponCode, totalAmount,discountPercentage } = req.body

        if (req.session.couponId) {
            return res.status(400).json({ message: "A coupon has already been applied!" });
        }
        const data = await Coupon.findOne({  couponCode: couponCode })
        
        
        if (data !== null && data.couponMinPurchase > totalAmount) {
            res.status(400).json({ message: `This coupon is only valid for Purchases Over ${data.couponMinPurchase}` })
        } else if (data !== null) {

            var newPrice=Math.floor(totalAmount - (totalAmount * discountPercentage / 100))
            console.log(newPrice,"newprice");
            
            req.session.coupon = data.couponDiscount;
            req.session.couponId = data._id
            res.status(200).json({ success: true ,newPrice:newPrice})
        } else {
            res.status(400).json({ message: "coupen code is incorrect!" })
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}
const removeCuopon =async(req, res, next) => {
    try {
        // Remove coupon from session
        req.session.coupon = null;
        req.session.couponId = null;

        return res.status(200).json({ success: true, message: "Coupon removed successfully!" });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}
const clearCouponOnRefresh = (req, res, next) => {
    if (req.method === 'GET' && req.session.couponId) {
        // Clear coupon session data on page refresh
        req.session.coupon = null;
        req.session.couponId = null;
    }
    next();
};



module.exports={
    loadCoupon,
    addCoupon,
    editCoupon,
    deleteCoupon,
    applyCoupon ,
    removeCuopon,
    clearCouponOnRefresh

}