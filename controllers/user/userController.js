const bcrypt = require('bcrypt');
const User = require('../../models/login/userschema');
const mailgen = require('mailgen')
const nodemailer = require('nodemailer')
const otpModel = require('../../models/authotp/otpauth')
const Product=require('../../models/prductmodel/productmodel')
const Category=require('../../models/categorymodel')
const Offer = require('../../models/offerModel')



const otpGenrator = () => {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
}

const sendotp = async (req, res) => {
    const otp = otpGenrator()
    console.log(otp,'otpss');
    
    req.session.otp = otp;
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASSWORD,
        },
    })

    const mailGenerator = new mailgen({
        theme: "default",
        product: {
            name: "BOOGY",
            link: "https://mailgen.js/",
        },
    })
    const response = {
        body: {
            name: req.session.user,
            intro: "your OTP for BOOGY verification is",
            table: {
                data: [{
                    OTP: otp
                }]
            },
            outro: "Looking forward to doing more business",
        }
    }


    const mail = mailGenerator.generate(response)

    const message = {
        from: process.env.AUTH_EMAIL,
        to: req.session.user,
        subject: "BOOGY OTP Verification",
        html: mail
    }
    try {
        const newOtp = new otpModel({
            email: req.session.user,
            otp: otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 10000
        })

        const data = await newOtp.save()
        req.session.otpId = data._id
        await transporter.sendMail(message);
    } catch (error) {
        console.log(error.message);

    }

}
const resendotpGenrator = () => {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
}
const resendotp = async (req, res) => {
    const otp = resendotpGenrator()
//     const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//             user: process.env.AUTH_EMAIL,
//             pass: process.env.AUTH_PASSWORD,
//         },
//     })
//     const mailGenerator = new mailgen({
//         theme: "default",
//         product: {
//             name: "BOOGY",
//             link: "https://mailgen.js/",
//         },
//     })
//     const response = {
//         body: {
//             name: req.session.user,
//             intro: "your OTP for BOOGY verification is",
//             table: {
//                 data: [{
//                     OTP: otp
//                 }]
//             },
//             outro: "Looking forward to doing more business",
//         }
//     }


//     const mail = mailGenerator.generate(response)

//     const message = {
//         from: process.env.AUTH_EMAIL,
//         to: req.session.user,
//         subject: "BOOGY OTP Verification",
//         html: mail
//     }
//     try {
//         const newOtp = new otpModel({
//             email: req.session.user,
//             otp: otp,
//             createdAt: Date.now(),
//             expiresAt: Date.now() +3000
//         })

//         const data = await newOtp.save()
//         req.session.otpId = data._id
//         await transporter.sendMail(message);
//     } catch (error) {
//         console.log(error.message);

//     }
}

const getForget=async(req,res)=>{
    try {
        res.render('forgetPassword')
    } catch (error) {
        console.log(error);
        
    }
}
const forgetOtp=async(req,res)=>{
    try {
        const userEmail = req.session.forgerUser;
        res.render('forgetOtp',{message : `${userEmail}`})
    } catch (error) {
        console.log(error);
        
    }
}

const forgetPassword=async(req,res)=>{
    req.session.forgerUser = req.body.email;

    
const otp=otpGenrator();
console.log(otp,'otp sss');

const transporter=nodemailer.createTransport({
    service:'Gmail',
    auth:{
        user:process.env.AUTH_EMAIL,
        pass:process.env.AUTH_PASSWORD,
    },
})

const mailGenerator=new mailgen({
    theme:'default',
    product:{
        name:'Boogy',
        link:"https://mailgen.js/",
    },
})

const response={
    body:{
        name:req.body.email,
        intro:'your OTP for boogy is',
        table:{
            data:[{
                OTP:otp
            }]
        },
        outro:'Looking forward to doing more business',
    }
}

const  mail=mailGenerator.generate(response)

const message={
    from:process.env.AUTH_EMAIL,
    to:req.body.email,
    subject:'Boogy otp Verification ',
    html:mail
}
try{
    const newOtp=new otpModel({
        email:req.session.forgerUser,
        otp : otp,
        createdAt:Date.now(),
        expiresAt:Date.now()+30000
    })

    const data = await newOtp.save()
    req.session.otpId = data._id
    await transporter.sendMail(message);
    res.redirect('/forgetOtp');
}catch(error){
    console.log(error.message);
    
}

}
const loadResetPassword=async(req,res)=>{
    try {
       
        
        res.render('resetForgetPassword')
    } catch (error) {
        console.log(error);
        
    }
}

const securePassword=async(password)=>{
    try{
        const passwordHash=await bcrypt.hash(password,10)
        return passwordHash;
    }catch(error){
        console.log(error.message);
        
    }
}

const resetPassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    
    const email = req.session.forgerUser;

    if (newPassword !== confirmPassword) {
        return res.redirect('/resetPassword?message=Passwords do not match');
    }

    try {
        const hashedPassword = await securePassword(newPassword);
        await User.updateOne({ email: email }, { password: hashedPassword });

        // Optionally, clear the OTP record if needed
        await otpModel.deleteMany({ email: email });

        // Redirect to login or another page
        res.redirect('/login?message=Password updated successfully');
    } catch (error) {
        console.log(error.message);
        res.redirect('/resetPassword?message=An error occurred');
    }
};

const  verifyOtp = async (req, res) => {
    const { otp } = req.body;
    const otpA = otp.join('');
    const email = req.session.forgerUser;
    try {
        const otpRecord = await otpModel.findOne({
            email: email,
            otp: otpA,
            expiresAt: { $gt: Date.now() },
        });

        if (otpRecord) {
            // OTP is valid, proceed to password reset
            res.redirect('/resetPassword');
        } else {
            // Invalid OTP
            res.redirect('/forgetOtp?message=Invalid or expired OTP');
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/forgetOtp?message=An error occurred');
    }
};

const getregister = async (req, res) => {
    try {
        let user = null;
        if (req.session.user_id) {
            user = await User.findById(req.session.user_id);
        }
        res.render('register',{user})
    } catch (error) {
        console.log(error);
        res.status(500).send('internal server errr')
    }
}


const loadlogin = async (req, res) => {
    try {
             
        res.render('login');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                req.session.user_id = userData._id;
            
                return res.redirect('/home');
            } else {
                res.status(400).json({ message: 'Incorrect User Email or  Password' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.log(error.message);
        
    }
};

const insertUser = async (req, res) => {

    try {

        const { firstname, lastname, email, password, confirmpassword } = req.body;
        const userData = await User.findOne({ email: email });
        if (userData) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            confirmpassword
        });

        req.session.userData = newUser
        req.session.user = req.body.email

        await sendotp(req, res)


        // await newUser.save()

        res.status(200).json({ message: 'success' })


    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const resendOTP =  async(req,res)=>{
    try {
        await sendotp(req, res)
        res.render('registerotp')
    } catch (error) {
        
    }
}

const loadotp = async (req, res) => {
    try {
        res.render('registerotp')
    } catch (error) {
        console.log(error);
    }
};

const verifyotp = async (req, res) => {
    try {
        const { otp } = req.body;
        const dbotp = req.session.otp;
        if (otp === dbotp) {
            const userData = req.session.userData
            User.create(userData)
            res.status(200).json({success:true, message: 'OTP verification successfull' });

            // res.render('login', { message: 'OTP verification successfull' })
        } else {
            res.status(400).json({ message: 'OTP verification failde' });
        }
    } catch (error) {
        res.send(error)
    }
   
}
const loadhome = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;
        const products = await Product.find({ isBlocked: false })
            .skip(skip)
            .limit(limit)
            .sort({created_at:-1})
            .populate('offer');
        const categories = await Category.find({ isBlocked: false }).populate('offer');

        let user = null;
        if (req.session.user_id) {
            user = await User.findById(req.session.user_id);
        }
        const totalProducts = await Product.countDocuments({ isBlocked: false });
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('home', {
            products,
            categories,
            user,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const productDetails = async (req, res) => {
    try {
        // Find the product and populate category and only the last offer
        const product = await Product.findById(req.params.id)
            .populate('category')
            .populate({
                path: 'offer',
                options: { limit: 1, sort: { _id: -1 } } // Populate only the last offer
            });

            let user = null;
            if (req.session.user_id) {
                user = await User.findById(req.session.user_id);
            }
        const products = await Product.find({ isBlocked: false }).populate({
            path: 'offer',
            options: { limit: 1, sort: { _id: -1 } } // Populate only the last offer
        });

        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('singleProduct', { product, products,user });
       
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};




const loadProfile=async(req,res)=>{
    try {
        const userId=req.session.user_id
        const user=await User.findById(userId)
        
        res.render('userProfile',{user})
    } catch (error) {
        console.log(error);
    }
}


const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    console.log(req.body);
    
    const userId = req.session.user_id;

    if (!currentPassword || !newPassword) {
        
        return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    try {
        const user = await User.findById(userId);
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId,{ $set : { password: hashedPassword }});
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ success: false, message: 'Error updating password' });
    }
};


const editDetails = async (req, res) => {
    const { name } = req.body;
    
    const userId = req.session.user_id;

    try {
       const upUser = await User.findByIdAndUpdate(userId, { $set : { firstname : name}},{new : true});
       console.log(upUser,'sftfdcv');
       
        res.status(200).json({ success: true, message: 'Details updated successfully' });
    } catch (error) {
        console.error('Error updating details:', error);
        res.status(500).json({ success: false, message: 'Error updating details' });
    }
};

const UserLogout = async (req,res) => {
    try{
        req.session.destroy();
        res.redirect('/login')
    }catch(error){
        console.log(error);
    }
}
const loadShopPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5; // Number of items per page
        const skip = (page - 1) * limit;

        // Fetch products with offers for the current page
        const products = await Product.find({ isBlocked: false })
            .skip(skip)
            .limit(limit)
            .sort({created_at:-1})
            .populate({
                path: 'offer',
                options: { sort: { createdAt: -1 }, limit: 1 } // Fetch only the last offer
            });

            let user = null;
            if (req.session.user_id) {
                user = await User.findById(req.session.user_id);
            }
        const totalProducts = await Product.countDocuments({ isBlocked: false });
        const categories = await Category.find({ isBlocked: false }).populate({
            path: 'offer',
            options: { sort: { createdAt: -1 }, limit: 1 } // Fetch only the last offer
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('shopPage', {
            user,
            products,
            categories,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};





const productFilter = async (req, res, next) => {
    try {
        const 
        Price = req.query.sortByPrice
        const category = req.query.sortByCategory        


        let query = { isBlocked: false };
        let sort;

        if (Price !== 'all') {
            switch (Price) {
                case 'lowToHigh':
                    sort = { price: 1 };
                    break;
                case 'highToLow':
                    sort = { price: -1 };
                    break;
                case 'A-Z':
                    sort = { productName: 1 };
                    break;
                 case 'Z-A':
                     sort = { productName: -1 };
                    break;
                
                default:
                    sort = { price: -1 }
            }
        }

        if (category !== 'all') {
            query = { ...query, category: category };
        }

        const products = await Product.find(query).sort(sort)  
              
        res.status(200).json({ products });

    } catch (error) {
        console.log(error.message);
        next(error)
    }
}


const searchProduct = async (req, res) => {
    try {
        let userId = req.session.user_id;
        let userData = null;
        if (userId) {
            userData = await User.findById({ _id: userId });
        }

        // Pagination settings
        const currentPage = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const productPerPage = 28;
        const skip = (currentPage - 1) * productPerPage;

        const totalProduct = await Product.countDocuments({ isBlocked: false });
        const totalPages = Math.ceil(totalProduct / productPerPage);
        // Pagination end

        const categoryData = await Category.find({ isBlocked: false });

        let productData = [];
        const searchTerm = req.query.searching ? new RegExp(req.query.searching, 'i') : null;

        if (searchTerm) {
            productData = await Product.find({
                $and: [
                    { isBlocked: false },
                    {
                        productName: searchTerm 
                    }
                ]
            }).skip(skip).limit(productPerPage);
        } else {
            productData = await Product.find({ isBlocked: false }).skip(skip).limit(productPerPage);
        }

        res.render('shopPage', {
            user: userData,
            products: productData,
            categories: categoryData,
            currentPage,
            totalPages
        });

    } catch (error) {
        console.log(error.message);
    }
};

 

module.exports = {
    loadlogin,
    verifyLogin,
    getregister,
    insertUser,
    loadotp,
    verifyotp,
    loadhome,
    resendOTP,
    productDetails,
    loadProfile,
    changePassword,
    editDetails,
    UserLogout,
    forgetPassword,
    getForget,
    forgetOtp,
    resetPassword, 
    verifyOtp ,
    loadResetPassword ,
    loadShopPage,
    productFilter,
    searchProduct
    
};
