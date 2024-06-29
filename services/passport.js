// Get the configuration values
require('dotenv').config();
const User = require('../models/User');
const Credentials = require('../models/Credentials');

const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;
const WebAuthnStrategy = require('passport-fido2-webauthn');
const SessionChallengeStore = WebAuthnStrategy.SessionChallengeStore;
const store = new SessionChallengeStore();
const base64url = require('base64url');

/*
 * After a successful authentication, store the user id in the session
 * as req.session.passport.user so that it persists across accesses.
 * See: https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
 */
passport.serializeUser((user, done) => {
    console.log('Serialiazing user:', user);
    done(null, user.id);
});

/*
* On each new access, retrieve the user profile from the session and provide it as req.user
* so that routes detect if there is a valid user context. 
*/
passport.deserializeUser(async (id, done) => {
    const user = await User.findOne({ _id: id });
    console.log('Deserialiazing user:', user);
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


// WebAuthn Strategy
passport.use(new WebAuthnStrategy({ store: store }, async function verify(id, userHandle, cb) {
  const cred = await Credentials.findOne({ external_id: id });

  if (!cred ) {
    return cb(null, false, { message: 'Invalid key' });
  }
  console.log('Cred:', cred );

  const publicKey = cred.public_key;
  let user = await User.findOne({ authKeyId: cred.googleId});

  if (!user) {
    return cb(null, false, { message: 'Invalid user' });
  }

  if (Buffer.compare(user.authKeyId, userHandle) != 0) {
    return cb(null, false, { message: 'Invalid' });
  }

  return cb(null, user, publicKey);
}, async function register(user, id, publicKey, cb) {

  const findUser = await User.findOne({ email: user.name });

  if (findUser) {
    findUser.displayName = user.displayName;
    findUser.authKeyId = user.id;
    await findUser.save();

    await new Credentials({
      googleId: findUser.authKeyId,
      external_id: id,
      public_key: publicKey
    }).save();

    return cb(null, findUser);
  }

  return cb(null, false, { message: 'Invalid user' });
}));

function expiryDate(seconds) {
  const date = new Date();
  date.setSeconds(date.getSeconds() + seconds);
  return date.toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'long' });
}

   // db.get('SELECT * FROM public_key_credentials WHERE external_id = ?', [ id ], function(err, row) {
    //   if (err) { return cb(err); }
    //   if (!row) { return cb(null, false, { message: 'Invalid key. '}); }
    //   var publicKey = row.public_key;
    //   db.get('SELECT * FROM users WHERE rowid = ?', [ row.user_id ], function(err, row) {
    //     if (err) { return cb(err); }
    //     if (!row) { return cb(null, false, { message: 'Invalid key. '}); }
    //     if (Buffer.compare(row.handle, userHandle) != 0) {
    //       return cb(null, false, { message: 'Invalid key. '});
    //     }
    //     return cb(null, row, publicKey);
    //   });
    // })

module.exports = passport;
