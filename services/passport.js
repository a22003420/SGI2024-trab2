
var WebAuthnStrategy = require('passport-fido2-webauthn');
var SessionChallengeStore = require('passport-fido2-webauthn').SessionChallengeStore;

var db = require('../db');

// Get the configuration values
require('dotenv').config();
const User = require('../models/User');

const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var store = new SessionChallengeStore();

/*
 * After a successful authentication, store the user id in the session
 * as req.session.passport.user so that it persists across accesses.
 * See: https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
 */
passport.serializeUser((user, done) => {
    // console.log('Serialiazing user:', user);
    done(null, user.id);
});

/*
* On each new access, retrieve the user profile from the session and provide it as req.user
* so that routes detect if there is a valid user context. 
*/
passport.deserializeUser(async (id, done) => {
    const user = await User.findOne({ _id: id });
    // console.log('Deserialiazing user:', user);
    done(null, user);
});

/*  Google AUTH  */

passport.use(
    new GoogleStrategy(
        // Strategy Parameters
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: process.env.REDIRECT_URL
            // proxy: true // Tell passport to trust the HTTPS proxy
        },
        // Verify callback
        async (accessToken, refreshToken, params, profile, done) => {
            console.log('Expires in:', params.expires_in, 'seconds');
            console.log('Refresh Token:', refreshToken);
            // Check if user already exists in the database
            try {
                let thisUser = await User.findOne({ googleId: profile.id });
                if (thisUser) {
                    thisUser.accessToken = accessToken;
                    thisUser.expiryDate = expiryDate(params.expires_in)
                    await thisUser.save();
                    console.log('User already exists:', thisUser);
                } else {
                    // Create a new user
                    thisUser = await new User({
                        googleId: profile.id,
                        displayName: profile.displayName,
                        email: profile.emails[0].value,
                        accessToken: accessToken,
                        expiryDate: expiryDate(params.expires_in)
                    }).save();
                    console.log('New user:', thisUser);
                }
                done(null, thisUser);
            } catch (err) {
                console.error(err);
            }
        }
    ));

function expiryDate(seconds) {
    const date = new Date();
    date.setSeconds(date.getSeconds() + seconds);
    // return Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'long' }).format(date);
    return date.toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'long' });
}



passport.use(new WebAuthnStrategy({ store: store }, function verify(id, userHandle, cb) {
  db.get('SELECT * FROM public_key_credentials WHERE external_id = ?', [ id ], function(err, row) {
    if (err) { return cb(err); }
    if (!row) { return cb(null, false, { message: 'Invalid key. '}); }
    var publicKey = row.public_key;
    db.get('SELECT * FROM users WHERE rowid = ?', [ row.user_id ], function(err, row) {
      if (err) { return cb(err); }
      if (!row) { return cb(null, false, { message: 'Invalid key. '}); }
      if (Buffer.compare(row.handle, userHandle) != 0) {
        return cb(null, false, { message: 'Invalid key. '});
      }
      return cb(null, row, publicKey);
    });
  });
}, function register(user, id, publicKey, cb) {
  db.run('INSERT INTO users (username, name, handle) VALUES (?, ?, ?)', [
    user.name,
    user.displayName,
    user.id
  ], function(err) {
    if (err) { return cb(err); }
    var newUser = {
      id: this.lastID,
      username: user.name,
      name: user.displayName
    };
    db.run('INSERT INTO public_key_credentials (user_id, external_id, public_key) VALUES (?, ?, ?)', [
      newUser.id,
      id,
      publicKey
    ], function(err) {
      if (err) { return cb(err); }
      return cb(null, newUser);
    });
  });
}));