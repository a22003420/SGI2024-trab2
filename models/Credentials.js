require('dotenv').config();
const mongoose = require('mongoose');

const dbString = process.env.DB_STRING;

async function dbConnect() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(dbString);
    console.log('Connected to MongoDB from Credentials');
  } catch (err) {
    console.error(err);
  }
}

dbConnect().catch(err => console.error(err));

const CredentialsSchema = new mongoose.Schema({
  googleId: { type: Buffer, required: true },  // should be a Buffer not a String!!! not working with String type
  external_id: { type: String, required: true }, 
  public_key : { type: String, required: true } 
});

const Credentials = mongoose.model('credentials', CredentialsSchema);

module.exports = Credentials;
