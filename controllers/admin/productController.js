const Products=require('../../models/prductmodel/productmodel')
const Category=require('../../models/categorymodel')

// product manage
// 
const loadProductmanage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6; // Number of items per page
        const skip = (page - 1) * limit;

        // Search query
        const searchQuery = req.query.search || '';
        
        // Build the query object
        const query = {
            isBlocked: false, // Example filter; adjust as needed
            $or: [
                { productName: { $regex: searchQuery, $options: 'i' } },
            ]
        };

        const [products, totalProducts] = await Promise.all([
            Products.find(query).skip(skip).limit(limit).sort({created_at:-1}).populate('category'),
            Products.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalProducts / limit);

        res.render('productManagement', {
            products,
            currentPage: page,
            totalPages,
            searchQuery // Pass search query to the view to retain the search term
        });

    } catch (error) {
        console.log(error);
    }
};

const addProductmanage= async (req, res) => {
    try {
        const categories = await Category.find()
        res.render('addproduct',{ categories})
    } catch (error) {
        console.log(error.message);
    
    }
} 
const addProduct = async (req, res) => {
    try {
        const { productName, category, price, quantity, description, discount, discountPrice } = req.body;
        const cate = await Category.findById(category)
        const productImages = [];
        
        if (req.files) {
            if (req.files.productImage1) productImages.push(req.files.productImage1[0].filename);
            if (req.files.productImage2) productImages.push(req.files.productImage2[0].filename);
            if (req.files.productImage3) productImages.push(req.files.productImage3[0].filename);
            if (req.files.productImage4) productImages.push(req.files.productImage4[0].filename);
        }
 
        const newProduct = new Products({

            productName,
            category: cate._id,
            price,
            quantity,
            description,
            productImage : productImages,// store the array of image filenames
            discount,
            discountPrice:price
        });

        await newProduct.save();
        res.redirect('/admin/loadProductmanage');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const blockAndUnblockProduct = async (req, res) => {
    try {
        const productId = req.query.id;
        const product = await Products.findById(productId);

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

const editProductPage = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Products.findById(productId).populate('category');
        const categories = await Category.find();

        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.render('editProduct', { product, categories });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { productName, category, price, quantity, description, discount, discountPrice } = req.body;

        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const productImages = product.productImage.slice(); // Get existing images

        // Check and update images
        if (req.files) {
            if (req.files.productImage1 && req.files.productImage1[0]) productImages[0] = req.files.productImage1[0].filename;
            if (req.files.productImage2 && req.files.productImage2[0]) productImages[1] = req.files.productImage2[0].filename;
            if (req.files.productImage3 && req.files.productImage3[0]) productImages[2] = req.files.productImage3[0].filename;
            if (req.files.productImage4 && req.files.productImage4[0]) productImages[3] = req.files.productImage4[0].filename;
        }

        // Update the product details
        const updatedProduct = await Products.findByIdAndUpdate(productId, {
            productName,
            category,
            price,
            quantity,
            description,
            productImage: productImages, // Use updated images
            discount,
            discountPrice: discountPrice ? discountPrice : price
        }, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Failed to update product' });
        }

        res.status(200).json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



module.exports={
    loadProductmanage,
    addProductmanage,
    addProduct,
    blockAndUnblockProduct,
    editProductPage,
    updateProduct ,

}