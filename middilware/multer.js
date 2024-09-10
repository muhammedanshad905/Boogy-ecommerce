// const multer = require('multer')
// const path = require('path')

// const storage = multer.diskStorage({
//     destination: (req,file,callBack)=>{
//         callBack(null,'./public/assets/productImages')
//     },
//     filename:(req,file,callBack)=>{
//         const ext = path.extname(file.originalname)
//         const fileName = file.originalname.replace(ext, '')
//         callBack(null, `${fileName}-${Date.now()}${ext}`)
//     }
// })

// const upload =multer({storage:storage,limits:{'files':4}})

// const Upload = multer({
//     storage: storage,
//     limits: { fileSize: 1024 * 1024 * 5 } 
// }).fields([
//     { name: 'productImage1', maxCount: 1 },
//     { name: 'productImage2', maxCount: 1 },
//     { name: 'productImage3', maxCount: 1 },
//     { name: 'productImage4', maxCount: 1 }
// ]);

// module.exports={
//     upload,
//     Upload
// }
const multer = require('multer');
const path = require('path');

// Storage configuration for product images
const productStorage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './public/assets/productImages');
    },
    filename: (req, file, callBack) => {
        const ext = path.extname(file.originalname);
        const fileName = file.originalname.replace(ext, '');
        callBack(null, `${fileName}-${Date.now()}${ext}`);
    }
});

// Storage configuration for category images
const categoryStorage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './public/assets/categoryImg');
    },
    filename: (req, file, callBack) => {
        const ext = path.extname(file.originalname);
        const fileName = file.originalname.replace(ext, '');
        callBack(null, `${fileName}-${Date.now()}${ext}`);
    }
});

// Product upload middleware
const productUpload = multer({
    storage: productStorage,
    limits: { fileSize: 1024 * 1024 * 5 } 
}).fields([
    { name: 'productImage1', maxCount: 1 },
    { name: 'productImage2', maxCount: 1 },
    { name: 'productImage3', maxCount: 1 },
    { name: 'productImage4', maxCount: 1 }
]);

// Category upload middleware
const categoryUpload = multer({
    storage: categoryStorage,
    limits: { fileSize: 1024 * 1024 * 5 }
}).single('categoryImage');

module.exports = {
    productUpload,
    categoryUpload
};
