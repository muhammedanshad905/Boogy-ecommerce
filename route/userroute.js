const express=require('express')
const userroute=express()
const passport =require('passport');
const config=require('../config/config')
const userController = require('../controllers/user/userController')
const UserAddressController=require('../controllers/user/UserAddressControl')
const cartController=require('../controllers/user/cartController')
const orderController=require('../controllers/user/orderController')
const whishlistController=require('../controllers/user/wishlistController')
const walletController=require('../controllers/user/walletController')
const couponController=require('../controllers/admin/couponController')
const session=require('express-session')



const auth=require('../middilware/user/userAuth');
const gAuth = require('../public/user/js/googleAuth');
userroute.set('view engine','ejs')
userroute.set('views','./views/user')

userroute.use(session({
    secret:config.sessionSecret,
    resave:false,
    saveUninitialized:true
}))

userroute.use(express.json())
userroute.use(express.urlencoded({extended:true}))
userroute.use(passport.initialize());
userroute.use(passport.session());
const path=require('path')

// Google Auth Routes
userroute.get('/auth/google', passport.authenticate('google', {
    scope: ['profile','email']
  }));
  
  userroute.get('/auth/google/callback',passport.authenticate('google', { failureRedirect: '/login' }),gAuth.googleSuccess);
  
  userroute.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });
  
  userroute.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/');
    }
    res.render('profile', { user: req.user });
  });


userroute.get('/',userController.loadhome)
userroute.get('/login',auth.isLogout,userController.loadlogin)
userroute.get('/getForget', auth.isLogout, userController.getForget);
userroute.post('/forgetPassword', auth.isLogout, userController.forgetPassword); // Route to handle sending OTP
userroute.get('/forgetOtp', auth.isLogout, userController.forgetOtp);
userroute.post('/forgotOtpVerify', auth.isLogout, userController.verifyOtp); // Route to verify OTP
userroute.get('/resetPassword', auth.isLogout, userController.loadResetPassword); // Load reset password page
userroute.post('/resetPassword', auth.isLogout, userController.resetPassword); // Handle password reset

userroute.post('/verifyLogin',auth.isLogout,userController.verifyLogin)
userroute.get('/register',auth.isLogout,userController.getregister);
userroute.post('/register',userController.insertUser)
userroute.get('/registerotp',auth.isLogout,userController.loadotp);
userroute.post('/otpverify',auth.isLogout,userController.verifyotp)
userroute.get('/resendOTP',auth.isLogout,userController.resendOTP)
userroute.get('/home',userController.loadhome)
userroute.get('/productFilter',userController.productFilter)
 
// product details
userroute.get('/product/:id',userController.productDetails)
// userProfile
userroute.get('/loadProfile',auth.islogin,userController.loadProfile)
// userroute.get('/changePassword',userController.changePassword)
userroute.post('/changePassword',auth.islogin,userController.changePassword)
// userroute.get('/editDetails',userController.  editDetails)
userroute.post('/editDetails',auth.islogin,userController.  editDetails)
// load shop
userroute.get('/loadShopPage',userController.loadShopPage)

// userAddess routes
userroute.get('/loadUserAddress',UserAddressController.loadUserAddress)
// userroute.get('/addAddress',UserAddressController.getAddress)
userroute.post('/addAddress',auth.islogin,UserAddressController.addAddress)
userroute.put('/editAddress/:id',auth.islogin,UserAddressController.editAddress)
userroute.get('/address/:id',auth.islogin,UserAddressController.getAddressById);
userroute.delete('/deleteAddress/:id',UserAddressController.confirmDeleteAddress)
// userroute.delete('/deleteAddress/:id',UserAddressController.deleteAddress)



// Cart routs
userroute.get('/getCart',auth.islogin,cartController.getCart)
// userroute.get('/addToCart',auth.islogin, cartController.addToCart)
userroute.post('/addToCart',auth.islogin,cartController.addToCart)
userroute.post('/updateQuantity',auth.islogin,cartController.updateQuantity)
userroute.delete('/removeFromCart',auth.islogin,cartController.removeFromCart)
userroute.post('/addToCartFromHome',cartController.addToCartFromHome)
userroute.post('/addToCartFromShop',cartController.addToCartFromShop)


// checkout
userroute.get('/loadCheckout',auth.islogin,cartController.loadCheckout)
userroute.post('/addAddressC',auth.islogin,cartController.addAddress)
userroute.post('/applyCoupon',auth.islogin,couponController.applyCoupon)
// userroute.get('/clearCouponOnRefresh',auth.islogin,couponController.clearCouponOnRefresh)
userroute.put('/removeCoupon',auth.islogin,couponController.removeCuopon)
userroute.post('/placeOrder',auth.islogin,cartController.placeOrder)
userroute.post('/verifyPayment',auth.islogin,cartController.verifyPayment )
// orderpage
userroute.get('/loadOrdersuccess',auth.islogin,orderController.loadOrdersuccess)
userroute.get('/orderHistory',auth.islogin,orderController.loadOrderHistory)
userroute.patch('/cancelOrder',auth.islogin,orderController.cancelOrder)
userroute.post('/retryPayment', auth.islogin,orderController.retryPayment);
userroute.patch('/returnOrder',auth.islogin,orderController.returnOrder)
userroute.post('/updateOrderStatus',orderController.razorpayFailure)
// userroute.post('/updateOrder',orderController.paymentFailure )

userroute.get('/loadOrderDetails',auth.islogin,orderController.loadOrderDetails)
userroute.get('/loadInvoice',auth.islogin,orderController.loadInvoice)

// whishlist

userroute.get('/loadWishlist', whishlistController.loadWishlist)
userroute.post('/addToWishlist',whishlistController.addToWishlist)
userroute.post('/addToCartFromWishlist',whishlistController.addToCartFromWishlist)

// wallet
userroute.get('/loadWallet',walletController.loadWallet)
userroute.post('/createOrder',walletController.createOrder)
userroute.post('/verifyPayments',walletController.verifyPayments)

// search
userroute.get('/searchProduct',userController.searchProduct)


userroute.get('/UserLogout',auth.islogin,userController.UserLogout);

userroute.get('*', (req, res) => {
  res.render('error-404')
})


module.exports = userroute