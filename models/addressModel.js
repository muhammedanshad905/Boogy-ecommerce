const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firstname:String,
  lastname:String,
  street: String,
  city: String,
  state: String,
  postalCode: String,
  phone:Number,
  email:String
});

const userSchema = new mongoose.Schema({
  // Other user fields...
  addresses: [addressSchema],
});
module.exports = mongoose.model('Address', addressSchema);
