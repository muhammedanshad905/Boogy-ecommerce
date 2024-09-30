const User = require('../../models/login/userschema')
const Order=require('../../models/orderModel')
const bcrypt = require("bcrypt")

const PDFDocument = require('pdfkit');
// const PDFTable = require('pdfkit-table')
const ExcelJS = require('exceljs');
const fs = require('fs')


const loadloging=(req,res)=>{
    try {
     res.render('login')   
    } catch (error) {
        console.log(error);
    }
}

//----------------------------------------------------
const verifyLogin = async (req, res) => {
    try {

        const { email, password } = req.body;
        if (email === process.env.ADMIN_EMAIL) {
            if (password === process.env.ADMIN_PASSWORD) {
                req.session.admin_id = email
                 res.status(200).json({ success: true });
            } else {
                 res.status(400).json({ message: 'Incorrect Admin Email or Password',  field:"password"});
            }
        }else{
             res.status(400).json({ message: 'Incorrect Admin Email or Password' ,field :"email"}); 
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const loadDashboard = async (req, res) => {
    try {
        const order = await Order.find().sort({ createdAt: -1 });

        let grandTotal = 0;
        let totalSalesCount = 0;

        for (let orderData of order) {
            grandTotal += orderData.totalAmount;

            for (let product of orderData.orderedItems) {
                totalSalesCount += product.quantity;
            }
        }

        const totalOrderCount = order.length; 

        res.render('dashboard', {
            totalOrderCount,
            totalSalesCount,
            grandTotal,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};


// usermanage

const loadUserManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page number
        const limit = 6; // Number of items per page
        const skip = (page - 1) * limit; // Documents to skip

        // Get the search query from request
        const searchQuery = req.query.search || ''; 

        // Construct the query with $regex for case-insensitive search
        const query = {
            $or: [
                { username: { $regex: searchQuery, $options: 'i' } }, // Adjust field names as necessary
                { email: { $regex: searchQuery, $options: 'i' } } // Example of another field
            ]
        };

        // Fetch users for the current page
        const userData = await User.find(query).skip(skip).limit(limit).sort({createdAt:-1})

        // Count total number of users for pagination (using the same query)
        const totalUsers = await User.countDocuments(query);

        // Calculate total pages
        const totalPages = Math.ceil(totalUsers / limit);

        // Render the view with pagination and search data
        res.render('usermanage', {
            userData,
            currentPage: page,
            totalPages,
            searchQuery // Pass search query to the view to retain search state
        });

    } catch (error) {
        console.log("Error:", error.message); // Log any errors
    }
};



const blockAndUnblockUser=async(req,res)=>{
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id })
        userData.is_block = !userData.is_block
        await userData.save()

        if (userData.is_block) {
            delete req.session.user_id;
        }

        let message = userData.is_block ? "User Blocked successfully" : "User Unblocked successfully";

        res.status(200).json({ message })

    } catch (error) {
        console.log(error);
    }
} 

// const loadSales=async(req,res)=>{
//     try {
        
//         const order = await Order.find().sort({createdAt:-1})
//         console.log(order,"slaedsasdg");
        
//         if (order.orderedItems.orderStatus !=='Canceled'){
            

//             let grandTotal = 0
//             let totalSalesCount = 0
//             for(let orderData of order){
//             grandTotal += orderData.totalAmount
//             for(let product of orderData.orderedItems){
//                 totalSalesCount += product.quantity
//             }
//         }
        
//         const totalOrderCount = order.length; // Total number of orders
//         // const totalSalesCount = order.reduce((acc, order) => acc + order.orderedItems.quantity, 0);
//         res.render('salesReport',
//         {
//             totalOrderCount,
//             totalSalesCount,
//             order,
//             grandTotal
//         })
//     }
//     } catch (error) {
//         console.log(error);
        
//     }
// }

const loadSales = async (req, res) => {
    try {
        const order = await Order.aggregate([
            {
                $match: {
                    "orderedItems.orderStatus": { $eq: 'Delivered' } 
                }
            },
            {
                $sort: { createdAt: -1 } 
            }
        ]);

        console.log(order);
        

        let grandTotal = 0;
        let totalSalesCount = 0;

        for (let orderData of order) {
            grandTotal += orderData.totalAmount;
            for (let product of orderData.orderedItems) {
                totalSalesCount += product.quantity;
            }
        }

        const totalOrderCount = order.length; 

        res.render('salesReport', {
            totalOrderCount,
            totalSalesCount,
            order,
            grandTotal
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Error loading sales report");
    }
};


const updateSales =async(req,res)=>{
    try {        
       const filter = req.query.filter 
       
       const { startDate, endDate } = req.query;
       

       let salesReport;
       if (startDate && endDate) {
        const parsedStartDate = new Date(new Date(startDate).setHours(0, 0, 0, 0)); ;
        const parsedEndDate =new Date(new Date(endDate).setHours(23, 59, 59, 999));
        
        salesReport = await Order.find({
            createdAt: {
                $gte: parsedStartDate,
                $lte: parsedEndDate
            }
        });
        }else if (filter === 'day') {
           salesReport = await Order.find({
               createdAt: {
                   $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                   $lt: new Date(new Date().setHours(23, 59, 59, 999))
               }
           });
       }  else if (filter === 'week') {
           const startDate = new Date();
           const endDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
           salesReport = await Order.find({
               createdAt: {
                   $gte: endDate,
                   $lt: startDate
               }
           });
       }  else if (filter === 'year') {
           const yearStart = new Date(new Date().getFullYear(), 0, 1);
           const yearEnd = new Date(new Date().getFullYear() + 1, 0, 0);
           salesReport = await Order.find({
               createdAt: {
                   $gte: yearStart,
                   $lt: yearEnd
               }
           });
       }else{
        salesReport = await Order.find()
       }
       let grandTotal = 0
        let totalSalesCount = 0

        for(let orderData of salesReport){
            grandTotal += orderData.totalAmount
            for(let product of orderData.orderedItems){
                totalSalesCount += product.quantity
            }
        }
        
        const totalOrderCount = salesReport.length;

       res.json({ 
        salesReport,
        totalOrderCount,
        totalSalesCount,
        grandTotal
        });
    } catch (error) {
        res.status(404).json({message:'filter is not found'})
    }
}

function parseDateString(dateString) {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in JS Date
}

const downloadExcel = async (req, res) => {
    
    try {
        const { data } = req.body;
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Data');

        worksheet.columns = [
            { header: 'Order date', key: 'createdAt', width: 20 },
            { header: 'User Name', key: 'firstname', width: 20 },
            { header: 'Payment Methode', key: 'paymentMethod', width: 20 },
            // { header: 'Product Name', key: ' productName', width: 30 },
            { header: 'Product Name', key: 'productName', width: 30 },
            { header: 'price', key: 'price', width: 15 },
            { header: 'quantity', key: 'quantity', width: 20 },
            { header: 'Total Amount', key: 'totalAmount', width: 20 },
        ];
      
        // Adding rows >>
        worksheet.addRows(data);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="salesReport.xlsx"');

        workbook.xlsx.write(res).then(() => {
            res.status(200).end();
        });
    } catch (error) {
        console.log(error.message);
    }
}

const adminLogout = async (req,res) => {
    try{
        req.session.destroy();
        res.redirect('/admin')
    }catch(error){
        console.log(error);
    }
}


const dashStatus = async (req, res) => {
    try {
        const period = req.query.period || 'daily'; // Default to 'daily' if no period is provided
        const now = new Date();
        let startDate, endDate, dateGroupFormat;

        // Calculate the start and end dates for the period
        if (period === 'daily') {
            endDate = new Date(now.setHours(23, 59, 59, 999)); // End of the day
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 3); // Last 3 days
            dateGroupFormat = "%Y-%m-%d";
        } else if (period === 'weekly') {
            endDate = new Date(now.setHours(23, 59, 59, 999)); // End of the week
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - (3 * 7)); // Last 3 weeks
            dateGroupFormat = "%Y-%U";
        } else if (period === 'monthly') {
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // End of the month
            startDate = new Date(endDate);
            startDate.setMonth(startDate.getMonth() - 3); // Last 3 months
            dateGroupFormat = "%Y-%m";
        } else if (period === 'yearly') {
            endDate = new Date(now.getFullYear() + 1, 0, 1); // Start of next year
            startDate = new Date(now.getFullYear(), 0, 1); // Start of the year
            dateGroupFormat = "%Y";
        }

        // Convert dates to ISO string without time to ensure consistent comparison
        const startDateISO = new Date(startDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
        const endDateISO = new Date(endDate.toISOString().split('T')[0] + 'T23:59:59.999Z');

        console.log(`Start Date: ${startDateISO.toISOString()}`);
        console.log(`End Date: ${endDateISO.toISOString()}`);
        console.log(`Date Group Format: ${dateGroupFormat}`);

        // Aggregating all required data in one pipeline
        const result = await Order.aggregate([
            { $unwind: "$orderedItems" }, // Unwind the orderedItems array
            { $match: { "orderedItems.orderDate": { $gte: startDateISO, $lt: endDateISO } } }, // Filter by date range

            {
                $facet: {
                    perDay: [
                        {
                            $group: {
                                _id: { $dateToString: { format: dateGroupFormat, date: "$orderedItems.orderDate" } },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { "_id": 1 } }
                    ],
                    orderCounts: [
                        {
                            $group: {
                                _id: '$orderedItems.orderStatus',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    topCategories: [
                        {
                            $group: {
                                _id: '$orderedItems.category',
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ]
                }
            }
        ]);

        // Format `perDay` data to have dates in ISO format
        const formatPerDayData = data => {
            return data.map(item => ({
                _id: item._id, // Already in YYYY-MM-DD format
                count: item.count
            }));
        };

        // Sending the aggregated data to the frontend
        const aggregatedData = result[0]; // Since we used $facet, result is an array with one element
        res.json({
            status: aggregatedData.orderCounts,
            perDay: formatPerDayData(aggregatedData.perDay),
            category: aggregatedData.topCategories
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};


const getTopSellingProducts = async (req, res) => {
    try {
        const topProducts = await Order.aggregate([
            { $unwind: "$orderedItems" },
            { $group: {
                _id: "$orderedItems.productId",
                totalQuantity: { $sum: "$orderedItems.quantity" },
                productName: { $first: "$orderedItems.productName" },
                productImage: { $first: "$orderedItems.productImage" }
            }},
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json(topProducts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred while fetching top products." });
    }
};




module.exports={
    loadDashboard,
    verifyLogin,
    loadloging,
    loadUserManagement,
    blockAndUnblockUser,
    adminLogout,
    loadSales,
    updateSales,
    downloadExcel,
    dashStatus,
    getTopSellingProducts 
}


