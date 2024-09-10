const Category=require('../../models/categorymodel')
const bcrypt = require("bcrypt")

// categorymanagement
// const loadCategory=async(req,res)=>{
    
//         try {

//             const page = parseInt(req.query.page) || 1;
//             const limit =6; // Number of items per page
//             const skip = (page - 1) * limit;
    
//             const [categories, totalCategory] = await Promise.all([
//                 Category.find().skip(skip).limit(limit) // Adjust the populate as needed
               
//             ]);
    
//             const totalPages = Math.ceil(totalCategory / limit);
    
//             res.render('category', {
//                 categories,
//                 currentPage: page,
//                 totalPages
//             });
       
//     } catch (error) {
//         console.log(error);
//     }
// }

const loadCategory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page number
        const limit = 6; // Number of items per page
        const skip = (page - 1) * limit; // Documents to skip

        // Get the search query from request
        const searchQuery = req.query.search || ''; 

        // Construct the query with $regex for case-insensitive search
        const query = {
            name: { $regex: searchQuery, $options: 'i' } // Adjust field names as necessary
        };

        // Fetch categories for the current page and count total categories
        const [categories, totalCategory] = await Promise.all([
            Category.find(query).skip(skip).limit(limit),
            Category.countDocuments(query)
        ]);

        // Calculate total pages
        const totalPages = Math.ceil(totalCategory / limit);

        // Render the view with pagination and search data
        res.render('category', {
            categories,
            currentPage: page,
            totalPages,
            searchQuery // Pass search query to the view to retain search state
        });

    } catch (error) {
        console.log("Error:", error.message); // Log any errors
    }
};

 const loadAddCategory=async(req,res)=>{
    try {
        res.render('addCategory')
    } catch (error) {
     console.log(error);   
    }
 }
 const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const existingCategory=await Category.find({name:name});
        console.log(existingCategory);
        if(existingCategory.length > 0){
            return res.status(400).json({ success : false, message: 'Category alredy existed' });

        }
        const image = req.file;

        if (!name || !description || !image) {
            return res.status(400).json({  success : false, message: 'All fields are required' });
        }

        const category = new Category({
            name: name.trim(),
            description: description.trim(),
            image: image.filename
        });

        await category.save();
        res.status(201).json({ success : true, message: 'Category added successfully', category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success : false, message: 'An error occurred' });
    }
}
 const editCategory=async(req,res)=>{
    try {

        const {id,name,description}=req.body
        console.log(req.body)
        console.log("name",name, "id  :" , id);
        const image = req.file

        const imageUrl = image ? image.filename : ''
        let body = {};
        if(name){
            body.name = name;
        }
        if(description){
            body.description;
        }
        if(imageUrl){
            body.image = imageUrl;
        }
        const update=await Category.findByIdAndUpdate(id, body)
        if(!update){
            return res.status(404).json({error:'category not found'})

        }
        res.json(update)
    } catch (error) {
     console.log('error updating category ',error);
     res.status(500).json({ error: 'Internal server error' });
   
    }
 }

 const blockAndUnblockProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Category.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Toggle the isBlocked status
        product.isBlocked = !product.isBlocked;

        await product.save();

        let message = product.isBlocked ? "Product blocked successfully" : "Product unblocked successfully";

        res.status(200).json({ message });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
module.exports={
    loadCategory,
    loadAddCategory,
    addCategory,
    editCategory,
    blockAndUnblockProduct

}