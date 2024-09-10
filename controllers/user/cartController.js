const Cart = require('../../models/cartModel');
const Product = require('../../models/prductmodel/productmodel')
const Address = require('../../models/addressModel')
const Order = require('../../models/orderModel')
const Razorpay = require('razorpay')
const crypto = require('crypto');
const Coupon=require('../../models/couponModel')






const getCart = async (req, res) => {
    try {
        const userCart = await Cart.findOne({ userId: req.session.user_id })
        .populate('cartItems.productId')
        .populate('cartItems.offerId')

        if (!userCart) {
            res.render('cartManagement', { cart: [] });
        } else {
            const product = userCart.cartItems.map(item=>{
                return {
                    productName:item.productId.productName,
                    quantity: item.quantity,
                    price: item.price,
                    productImage: item.productId.productImage,
                    offerName: item.offerId ? item.offerId.offerName : null,
                    discountPercentage: item.offerId ? item.offerId.discountPercentage : null,
                    productId:item.productId._id,
                    _id:item._id
                }
            })
         
            res.render('cartManagement', { cart: product });
        }
    } catch (error) {
        console.log(error);
        // res.status(500).send('Server Error');
    }
};

// Utility function to calculate discount price
function calculateDiscountPrice(product) {    
    let price = product.price;

    if (product.offer.length > 0) {
        price -= price * (product.offer[product.offer.length-1].discountPercentage / 100);
    }    
    return price;
}

const addToCart = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { quantity, id } = req.body;
        const productId = id;
        const product = await Product.findById(id).populate('offer');

        if (!product) {
            return res.status(404).json({ success: false, message: 'product not found' })
        }

        const productName = product.productName
        const productImage = product.productImage
        const avaliableStock = product.quantity
        const discountPrice =calculateDiscountPrice(product);
        
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
                cartItems: [{
                    productId: productId,
                    quantity: quantity,
                    productName: productName,
                    price: discountPrice,
                    productImage: productImage,
                    offerId:product.offer ? product.offer._id : null
                }]
            });
        } else {
            const existingItem = cart.cartItems.find(item => item.productId.equals(productId));

            if (existingItem) {
                const newQuantity = existingItem.quantity += quantity;

                if (newQuantity > avaliableStock) {
                    return res.status(400).json({ success: false, message: `only ${avaliableStock}item in stock` })
                }

            } else { 
                cart.cartItems.push({
                    productId: productId,
                    quantity: quantity,
                    productName: productName,
                    price: discountPrice,
                    productImage: productImage,
                    offerId:product.offer ? product.offer._id : null
                });
            }
        }

        const cartData = await cart.save();
        if (cartData) {
            res.status(200).json({ success: true, message: 'added to cart' });
        } else {
            res.status(400).json({ success: false, message: 'not added to cart' })
        }
    } catch (error) {
        console.log(error);
        // res.status(500).json({ message: 'Server Error' });
    }
};

function calculateNewSubtotal(cartItems) {
    return cartItems.reduce((subtotal, item) => subtotal + (item.price * item.quantity), 0);
}

function calculateNewGrandTotal(cartItems) {
    const subtotal = calculateNewSubtotal(cartItems);
    const tax = 10.00; // Fixed tax amount
    const shipping = 5.00; // Fixed shipping amount

    return subtotal + tax + shipping;
}


const updateQuantity = async (req, res) => {
    try {
        const { change, productId} = req.body;   
        const userId = req.session.user_id;
        let cart = await Cart.findOne({ userId: userId });
        const index = cart.cartItems.findIndex(item => item.productId.equals(productId));
        
        if (index !== -1) {
            
            let product = await Product.findById(productId).populate('offer')            
            let discountPrice =calculateDiscountPrice(product)

            cart.cartItems[index].quantity += parseInt(change);

            if (cart.cartItems[index].quantity > product.quantity) {
                cart.cartItems[index].quantity = product.quantity
            }

            if (cart.cartItems[index].quantity <= 0) {
                cart.cartItems.splice(index, 1);
            } else {                
                cart.cartItems[index].price = discountPrice
            }
            const updatedCart = await cart.save();

        const newSubtotal = calculateNewSubtotal(updatedCart.cartItems);
        const newGrandTotal = calculateNewGrandTotal(updatedCart.cartItems);

        res.status(200).json({
            success: true,
            newQuantity: cart.cartItems[index]?.quantity || 0,
            productPrice: cart.cartItems[index]?.price || 0, // Adjust as per your schema
            newSubtotal,
            newGrandTotal
        })
        }else{
            res.status(404).json({ error: 'Product not found in cart' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal server error'});
        // next(error);
    }
}

const removeFromCart = async (req, res) => {
    try {
        const productId = req.query.productId;
        const userId = req.session.user_id
        const cart = await Cart.findOne({ userId: userId }).populate('cartItems')
        const index = cart.cartItems.findIndex((value) => {
            return value._id.toString() === productId.toString()
        })

        if (index !== -1) {
            cart.cartItems.splice(index, 1)
            await cart.save()
            res.sendStatus(200)
        } else {
            res.status(404)
        }
    } catch (error) {
        console.log(error.message);
        // res.status(500).json({ error: 'Internal server error'});
        // next(error);      
    }
}

// checkout page

const loadCheckout = async (req, res) => {
    try {
        let coupon=await Coupon.find({})
        let address = await Address.find({ userId: req.session.user_id });
        let cart = await Cart.findOne({ userId: req.session.user_id }).populate('cartItems.productId');
        let cartItems = cart ? cart.cartItems : [];

        let grandTotal = cartItems.reduce((total, item) => {
            return total + item.productId.price * item.quantity;
        }, 0);

        if(req.session.coupon){
            let discountPercentage = req.session.coupon;
           let  discountAmount = grandTotal * discountPercentage / 100;
            grandTotal=Math.floor(grandTotal - discountAmount)
        }

        res.render('checkoutManagement', { address, cart: cartItems, grandTotal ,coupon});
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
};

const addAddress = async (req, res) => {
    try {
        const newAddress = new Address({
            userId: req.session.user_id,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            postalCode: req.body.postalCode,
            phone: req.body.phone,
            email: req.body.email

        })

        const address = await newAddress.save()
        if (address) {
            res.status(200).json({ success: true, address })
        } else {
            res.status(400).json({ success: true, message: 'not found' })
        }

    } catch (error) {
        console.log(error);

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

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

 const placeOrder = async (req, res) => {
    try {
        const { paymentMethod, selectedAddressId } = req.body;
        const userId = req.session.user_id;
        const cart = await Cart.findOne({ userId: userId }).populate('cartItems');
        const address = await Address.findById(selectedAddressId);
        const orderItem = cart.cartItems;



        for (let item of cart.cartItems) {

            let productId = await Product.findById(item.productId);
            if (productId) {
                productId.quantity -= item.quantity;
            }
            await productId.save();
        }

        const calculateTotalAmount = (cart) => {
            let totalAmount = 0;

            cart.cartItems.forEach(item => {
                totalAmount += item.price * item.quantity;
            });

            return totalAmount;
        };

        const totalAmount = calculateTotalAmount(cart);



        let order = new Order({
            userId: userId,
            items: cart.cartItems,
            paymentMethod: paymentMethod,
            totalAmount: totalAmount,
            address: address,
            orderedItems: orderItem,
            status: 'Pending'
        });

        if (paymentMethod === 'Razorpay') {
            const options = {
                amount: totalAmount * 100,
                currency: 'INR',
                receipt: `receipt_order_${Date.now()}`,
            };

            const razorpayOrder = await razorpay.orders.create(options);

            order.paymentDetails = {
                orderId: razorpayOrder.id,
                paymentId: null,
                signature: null
            };
            await order.save();

            return res.json({
                success: true,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                orderId: order._id,
            });
        } else {
            await order.save();
            res.json({ success: true, orderId: order._id });
        }
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, error: 'Failed to place order.' });
    }
};




const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;

        const order = await Order.findById(orderId);

        const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        for (let item of order.orderedItems) {
            item.orderStatus = 'success'
        }

        if (generated_signature === razorpay_signature) {
            order.status = 'Paid';
            order.paymentDetails = {
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                signature: razorpay_signature,
            };
            await order.save(); 

            res.json({ success: true, orderId: orderId });
        } else {
            res.status(400).json({ success: false, error: 'Payment verification failed.' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, error: 'Failed to verify payment.' });
    }
};



const addToCartFromHome = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { quantity, id } = req.body;

        const productId = id;
        const product = await Product.findById(id)
        const productName = product.productName 
        const price = product.price

        if (!userId) {
            return res.status(401).json({ redirectUrl: '/login' });
        }

        let cart = await Cart.findOne({ userId: userId });


        if (!cart) {
            cart = new Cart({
                userId: userId,
                cartItems: [{ productId: productId, quantity: quantity, productName: productName, price: price }]
            });
        } else {
            const existingItem = cart.cartItems.find(item => item.productId.equals(productId));
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.cartItems.push({ productId: productId, quantity: quantity, productName: productName, price: price });
            }
        }

        const cartData = await cart.save();
        if (cartData) {
            res.status(200).json({ success: true, message: 'item added to cart' })
        } else {
            res.status(400).json({ success: false, message: 'item added to cart' })
        }
    } catch (error) {
        console.log(error);
        // res.status(500).json({ message: 'Server Error' });
    }
}

const addToCartFromShop = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { quantity, id } = req.body;

        const productId = id;
        const product = await Product.findById(id)
        const productName = product.productName
        const price = product.price

        if (!userId) {
            return res.status(401).json({ redirectUrl: '/login' });
        }

        let cart = await Cart.findOne({ userId: userId });


        if (!cart) {
            cart = new Cart({
                userId: userId,
                cartItems: [{ productId: productId, quantity: quantity, productName: productName, price: price }]
            });
        } else {
            const existingItem = cart.cartItems.find(item => item.productId.equals(productId));
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.cartItems.push({ productId: productId, quantity: quantity, productName: productName, price: price });
            }
        }

        const cartData = await cart.save();
        if (cartData) {
            res.status(200).json({ success: true, message: 'item added to cart' })
        } else {
            res.status(400).json({ success: false, message: 'item added to cart' })
        }
    } catch (error) {
        console.log(error);
        // res.status(500).json({ message: 'Server Error' });
    }
}
module.exports = {
    getCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    loadCheckout,
    addAddress,
    placeOrder,
    verifyPayment,
    addToCartFromHome,
    addToCartFromShop
};
