import { Schema, model } from 'mongoose';

const discountSchema = new Schema({
     discountName: {type: String, required: true, unique: true},
     discountPercentage: { type: Number, required: true },
     productName: { type: String },
     couponCode: { type: String },
     couponDescription: { type: String },
 
     productId: { type: String },
     groupId: { type: String },
     imagePath:{type:String},
     startDate: {type: Date, required: true},
     endDate: {type: Date, required: true},
     timeAdded: {type: Date, default: Date.now}
});

export default model('Discount', discountSchema);