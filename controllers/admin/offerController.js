const Offer=require('../../models/offerModel')
const Product=require('../../models/prductmodel/productmodel')
const Category=require('../../models/categorymodel')

const loadOffer=async(req,res)=>{
    try {
        const offer=await Offer.find()
        const products = await Product.find();
        const categories = await Category.find();
        res.render('offerPage', {
            offerName: '', 
            offerType: '', 
            products: products,
            categories: categories,
            productOffer: '', 
            categoryOffer: '', 
            discountPercentage: '', 
            maxRedeem: '', 
            offerDescription: '',
            productDetails:''
        });
    } catch (error) {
        console.log(error);
        
    }
}
const addOffers=async(req,res)=>{
    try {
        const { offerName, offerType, productOffer, categoryOffer, discountPercentage, maxRedeem, offerDescription } = req.body;
        
        
        const newOffer = new Offer({
            offerName,
            offerType,
            productOffer: offerType === 'product' ? productOffer : null,
            categoryOffer: offerType === 'category' ? categoryOffer : null,
            discountPercentage,
            maxRedeem,
            offerDescription 
        });
     
        // Apply the offer to the product or category
        if (offerType === 'product') {
            const product = await Product.findById(productOffer);            
            product.offer = newOffer._id;
            product.categoryOffer = product.categoryOffer || categoryOffer
            product.discountedPrice = product.price - (product.price * (discountPercentage / 100));
            
            await product.save();
        } else if (offerType === 'category') {
            const category = await Category.findById(categoryOffer);
            category.offer = newOffer._id;
            await category.save();

            // Optionally, you can apply the offer to all products in this category
            await Product.updateMany({ category: categoryOffer }, {
                $set: {
                    offer: newOffer._id,
                    discountedPrice: { $subtract: ["$price", { $multiply: ["$price", discountPercentage / 100] }] }
                }
            });
        }

        if(categoryOffer>productOffer){
             return categoryOffer
        }else if (productOffer > categoryOffer){
            return productOffer
        }else{
            await newOffer.save();

        }

        res.status(201).json({ message: 'Offer added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add offer' });
    }

}




const loadOfferListing = async (req, res) => {
    try {
        const offers = await Offer.find()
            .populate('productOffer')
            .populate('categoryOffer');

        const offerDetails = offers.map((offer) => {
            const details = {
                offerName: offer.offerName,
                offerType: offer.offerType,
                discountPercentage: offer.discountPercentage,
                maxRedeem: offer.maxRedeem,
                offerDescription: offer.offerDescription,
                createdAt: offer.createdAt,
                isListed:offer.isListed,
                offerId:offer._id,
            };
            
            if (offer.offerType === 'product' && offer.productOffer) {
                details.productName = offer.productOffer.productName;
                details.productPrice = offer.productOffer.price;
                details.discountedPrice = offer.productOffer.discountPrice;
            }

            if (offer.offerType === 'category' && offer.categoryOffer) {
                details.categoryName = offer.categoryOffer.name;
                details.categoryDescription = offer.categoryOffer.description;
            }


            return details;
        });        
        res.render('offerList', { offer: offerDetails });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error loading offers');
    }
};

const offerStatusChange = async (req, res, next) => {
    try {
        const offerId = req.query.offerId;
        const { shouldList } = req.body;

        const offer = await Offer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        offer.isListed = shouldList;

        await offer.save();

        if (shouldList) {
            // await Product.findByIdAndUpdate(offer.productOffer,{$addToSet: { offers: offerId } });

            if(offer.productOffer){
                await Product.findByIdAndUpdate(offer.productOffer,{$addToSet: { offer: offerId } });
            }else if(offer.categoryOffer){                
                await Product.updateMany({category:offer.categoryOffer},{$addToSet: { offer: offerId } });
            }
            
        } else {
            if(offer.productOffer){
                const product=await Product.findById(offer.productOffer)
                if(product){

                    await Product.findByIdAndUpdate(offer.productOffer,{ $pull: { offer: offerId } });
                    if(product.categoryOffer){
                        product.offer = product.categoryOffer
                        await product.save()
                    }
                }
            }else if(offer.categoryOffer){
                await Product.updateMany({category:offer.categoryOffer},{$pull: { offer: offerId } });
            }
        }

        let message = shouldList ? "Offer listed and activated successfully" : "Offer unlisted and inactivated successfully";

        res.status(200).json({ message });
    } catch (error) {
        console.error('Error in offerStatusChange:', error.message);
        next(error);
    }
};

const editOffer=async(req,res)=>{
    try { 
        const { id } = req.params;
        const { offerName, offerType, productOffer, categoryOffer, discountPercentage, maxRedeem, offerDescription } = req.body;
        
        const updatedOffer = await Offer.findByIdAndUpdate(id, {
            offerName,
            offerType,
            productOffer: offerType === 'product' ? productOffer : null,
            categoryOffer: offerType === 'category' ? categoryOffer : null,
            discountPercentage,
            maxRedeem,
            offerDescription
        }, { new: true });
        
        // Update the product or category
        if (offerType === 'product') {
            const product = await Product.findById(productOffer);            
            product.offer = updatedOffer._id;
            product.discountedPrice = product.price - (product.price * (discountPercentage / 100));
            await product.save();
        } else if (offerType === 'category') {
            const category = await Category.findById(categoryOffer);
            category.offer = updatedOffer._id;
            await category.save();

            await Product.updateMany({ category: categoryOffer }, {
                $set: {
                    offer: updatedOffer._id,
                    discountedPrice: { $subtract: ["$price", { $multiply: ["$price", discountPercentage / 100] }] }
                }
            });
        }
        
        res.status(200).json({ message: 'Offer updated successfully', offer: updatedOffer });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update offer' });
    } 
}

const deleteOffer = async (req, res) => {
    try {
        const { id } = req.query;
        console.log(id,'hhhh');
        

        const deletedOffer = await Offer.findByIdAndDelete(id);

        if (!deletedOffer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        res.status(200).json({ message: 'Offer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};
module.exports={ 
    loadOffer,
    addOffers,
    loadOfferListing,
    offerStatusChange,
    editOffer,
    deleteOffer 
}