const Wishlist =require('../../models/wishlistModel')
const Product=require('../../models/prductmodel/productmodel')
const Cart=require('../../models/cartModel')

const loadWishlist =async(req,res)=>{
    try {
        
        const userId=req.session.user_id
        const wishlist=await Wishlist.findOne({user:userId}).sort({createdAt:-1})
        .populate('products')
        
        res.render('wishlist',{wishlist})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'internal server error'})
    }
}

const addToWishlist=async(req,res)=>{
    try {
        const userId=req.session.user_id
        const productId=req.body.productId

        let wishlist=await Wishlist.findOne({user:userId}) 

        if(!wishlist){
            wishlist=new Wishlist({user:userId,products:[productId]})
        }else{
            if(!wishlist.products.includes(productId)){
                wishlist.products.push(productId)
            }
        }
        await wishlist.save()
        res.status(200).json({success:true,message:'product added to wishlist '})
    } catch (error) {
        console.log(error);
        res.status(500).json({success:false,message:'internal server error'})
        
    }
}
const addToCartFromWishlist=async(req,res)=>{
    try {
        const userId = req.session.user_id;
        const { quantity, id } = req.body;
        
        const productId = id;
        const product=await Product.findById(id)
        const productName=product.productName
        const avaliableStock =product.quantity
        const price=product.price

        if (!userId) {
            return res.status(401).json({ redirectUrl: '/login' });
        }

        let cart = await Cart.findOne({ userId: userId });
        

        if (!cart) {
            if (quantity > avaliableStock) {
                return res.status(400).json({ success: false, message: `only ${avaliableStock} item in stock` })
            }
            cart = new Cart({
                userId: userId,
                cartItems: [{ productId: productId, quantity: quantity,productName:productName,price:price }]
            });
        } else {
            const existingItem = cart.cartItems.find(item => item.productId.equals(productId));
            if (existingItem) {
                let newQuantity = existingItem.quantity += quantity;
                if (newQuantity > avaliableStock) {
                    return res.status(400).json({ success: false, message: `only ${avaliableStock}item in stock` })
                }
            } else {
                cart.cartItems.push({ productId: productId, quantity: quantity, productName:productName,price:price });
            }
        }
        
        const cartData = await cart.save();
        if(cartData){
            res.status(200).json({success : true,message : 'item added to cart'})
        } else{
            res.status(400).json({success : false, message : 'item added to cart'})
        }
    } catch (error) {
        console.log(error);
        // res.status(500).json({ message: 'Server Error' });
    }
}

module.exports={
    loadWishlist ,
    addToWishlist,
    addToCartFromWishlist
}