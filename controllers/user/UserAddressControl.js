const Address = require('../../models/addressModel');

// Load User Address
const loadUserAddress = async (req, res) => {
    try {
        const addresses = await Address.find({ userId: req.session.user_id });
        res.render('userAddress', { addresses });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
};


const addAddress = async (req, res) => {
    try {
        const userId=req.session.user_id;
        console.log(req.body,'rrrrrrrr');
        
        const newAddress = new Address(req.body);
        newAddress.userId = userId;
        await newAddress.save();
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
};

const editAddress = async (req, res) => {
    try {
        await Address.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
};

const getAddressById = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);
        res.json(address);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const confirmDeleteAddress=async(req,res)=>{
    try {
        const { id } = req.params;
        console.log(id,'oooooo');
        
        await Address.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
}
module.exports = {
    loadUserAddress,
    addAddress,
    editAddress,
    getAddressById,
    confirmDeleteAddress
   
};
