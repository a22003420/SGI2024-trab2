const credentialsSchema = new mongoose.Schema({
    googleId: String,
    external_id: String,
    public_key: String,
});

const Credentials = mongoose.model('credentials', credentialsSchema);

module.exports = Credentials;