const { isAuth } = require('../services/middleware');
const base64url = require('base64url');
const passport = require('passport');
const router = require('express').Router();
const { v4: uuid } = require('uuid');

// WebAuthn routes

// Route to get the challenge for public key signup
// router.post('/signup/public-key/challenge', async function(req, res, next) {
//   try {
//     console.log("signup challenge");
//     var handle = Buffer.alloc(16);
//     handle = uuid({}, handle);
//     console.log("handle:", handle);
//     var user = {
//       id: handle,
//       name: req.body.name,
//       displayName: req.body.name
//     };

//     console.log(req.body);
//     console.log("user:", user);

//     // Encode the ID and challenge in base64url
//     user.id = base64url.encode(user.id);
//     var encodedChallenge = base64url.encode(challenge);

//     // Send the JSON response with the user and encoded challenge
//     res.json({ user: user, challenge: encodedChallenge });
//   } catch (err) {
//     // If an error occurs, catch the error and pass it to the next error handler
//     next(err);
//   }
// });

// // Route to render the signup page
// router.get('/signup', isAuth, (req, res) => {
//   res.render('signup', {
//     user: req.user
//   });
// });

// module.exports = router;
