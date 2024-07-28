const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PlanSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    features: [String],
});

module.exports = mongoose.model('Plan', PlanSchema);