// itemModel.js
require('dotenv').config();
const mongoose = require('mongoose');

const dbString = process.env.DB_STRING;

async function dbConnect() {
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(dbString);
      console.log('Connected to MongoDB from Item');
    } catch (err) {
      console.error(err);
    }
  }

  dbConnect().catch(err => console.error(err));

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
