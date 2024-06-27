const Credential = require('../models/Credentials');
const WebAuthnStrategy = require('passport-fido2-webauthn');

// Get the configuration values



const SessionChallengeStore = WebAuthnStrategy.SessionChallengeStore;
const store = new SessionChallengeStore();
const base64url = require('base64url');

var db = require('../db');
const test = require('../services/store');

// Get the configuration values
require('dotenv').config();
const User = require('../models/User');

const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;



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

// WebAuthn Strategy
passport.use(
  new WebAuthnStrategy(
    {
      store: store
    },
    // Verify callback
    async (id, userHandle, cb) => {
      try {
        let cred = await Credential.findOne({ external_id: id });
        if (!cred) {
          return cb(null, false, { message: 'Invalid key.' });
        }
        let user = await User.findOne({ googleId: cred.googleId });
        if (!user) {
          return cb(null, false, { message: 'Invalid user.' });
        } else if (Buffer.compare(user.handle, userHandle) !== 0) {
          return cb(null, false, { message: 'Invalid handle.' });
        }
        return cb(null, user, cred.publicKey);
      } catch (err) {
        cb(err);
      }
    },

    async function register(user, external_id, publicKey, cb) {
      try {
        let foundUser = await User.findOne({ googleId: user.name });
        if (!foundUser) {
          return cb(null, false, { message: 'Invalid user.' });
        }
        foundUser.handle = foundUser.id;
        await foundUser.save();

        let cred = await Credential.findOne({ googleId: foundUser.googleId });
        if (cred) {
          cred.external_id = external_id;
          cred.publicKey = publicKey;
          await cred.save();
        } else {
          await new Credential({
            googleId: foundUser.googleId,
            external_id: external_id,
            publicKey: publicKey
          }).save();
        }
        return cb(null, foundUser);
      } catch (err) {
        console.error(err);
        return cb(err);
      }
    }
  )
);
