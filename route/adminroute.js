const exepress=require("express")
const adminroute=exepress()
const session=require("express-session")
const config=require("../config/config")

adminroute.use(session({
    secret:config.sessionSecret,
    resave:false,
    saveUninitialized:true
}))

const bodyParser=require("body-parser")
adminroute.use(bodyParser.json())
adminroute.use(bodyParser.urlencoded({extended:true}))

adminroute.set("view engine","ejs")
adminroute.set("views","./views/admin")

const adminControl=require("../controllers/admin/adminControl")

const auth=require('../middilware/admin/adminAuth')
const productControl=require('../controllers/admin/productController')
const categorycontrol=require('../controllers/admin/categorycontrol')
const orderController=require('../controllers/admin/adminOrderController.')
const offerController=require('../controllers/admin/offerController')
const couponController=require('../controllers/admin/couponController')
const { productUpload, categoryUpload }= require('../middilware/multer')


adminroute.get('/',auth.isLogout,adminControl.loadloging)
adminroute.get('/login',auth.isLogout,adminControl.loadloging) 
adminroute.post('/verifyLogin',adminControl.verifyLogin)
adminroute.get('/dashboard',auth.isLogin,adminControl.loadDashboard)
adminroute.get('/topProducts',adminControl.getTopSellingProducts)
adminroute.get('/dashStatus',auth.isLogin,adminControl.dashStatus)
// product management
adminroute.get('/loadProductmanage',auth.isLogin,productControl. loadProductmanage)
adminroute.get('/addProductmanage',auth.isLogin,productControl.addProductmanage)
adminroute.get('/addProduct',auth.isLogin,productControl.addProduct)
adminroute.post('/addProduct',productUpload,productControl.addProduct);
adminroute.get('/blockAndUnblockProduct',auth.isLogin,productControl.blockAndUnblockProduct);
adminroute.get('/editProduct/:id',auth.isLogin, productControl.editProductPage);
adminroute.post('/updateProduct/:id',productUpload, productControl.updateProduct);


// user management

adminroute.get('/loadusermanage',auth.isLogin,adminControl.loadUserManagement)
adminroute.get('/blockAndUnblockUser',auth.isLogin,adminControl.blockAndUnblockUser)

// category management
adminroute.get('/loadCategory',auth.isLogin,categorycontrol.loadCategory)
adminroute.get('/loadAddCategory',auth.isLogin,categorycontrol.loadAddCategory)
adminroute.post('/addCategory', categoryUpload,categorycontrol.addCategory) 
adminroute.patch('/editCategory',auth.isLogin, categoryUpload, categorycontrol. editCategory) 
adminroute.get('/blockAndUnblockProduct/:id',auth.isLogin,categorycontrol.blockAndUnblockProduct)

// order management
adminroute.get('/loadOrderlist',orderController.loadOrderlist)
adminroute.patch('/updateOrderStatus', orderController.updateOrderStatus)
adminroute.get('/adminOrderDetails',auth.isLogin,orderController.adminOrderDetails)

// offer management
adminroute.get('/loadOffer',offerController.loadOffer)
adminroute.post('/addOffers',offerController.addOffers)
adminroute.get('/loadOfferListing',offerController.loadOfferListing)
adminroute.post('/offerStatusChange', offerController.offerStatusChange);
adminroute.put('/editOffer/:id',offerController.editOffer)
adminroute.get('/logout',auth.isLogin,adminControl.adminLogout);
adminroute.delete('/deleteOffer',offerController.deleteOffer)


// coupon management
adminroute.get('/loadCoupon',couponController.loadCoupon)
adminroute.post('/addCoupon',couponController.addCoupon)
adminroute.put('/editCoupon',couponController.editCoupon)
adminroute.post('/applyCoupon',couponController.applyCoupon)
adminroute.delete('/deleteCoupon/:id',couponController.deleteCoupon)

// sales report
adminroute.get('/loadSales',adminControl.loadSales)
adminroute.get('/updateSalesReport',adminControl.updateSales)
adminroute.post('/downloadExcel',adminControl.downloadExcel)

adminroute.get('*', (req, res) => {
    res.render('admin404')
  })

module.exports=adminroute 
