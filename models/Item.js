// itemModel.js

const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'googleusers',
    },
    title: String,
    description: String,
    dataCreation: Date,
});

// Método para excluir um item pelo ID
itemSchema.statics.deleteItemById = async function(itemId) {
    try {
        const deletedItem = await this.findByIdAndDelete(itemId);
        return deletedItem;
    } catch (error) {
        throw new Error(error.message);
    }
};

const Item = mongoose.model('items', itemSchema);

module.exports = Item;
