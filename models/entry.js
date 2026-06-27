const mongoose = require('mongoose');
const entrySchema = new mongoose.Schema({
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
    text: String,
    audioUrl: String,
    imageUrl: String,
    createdAt: { type: Date, default: Date.now }
    
});
module.exports = mongoose.model('entry', entrySchema);