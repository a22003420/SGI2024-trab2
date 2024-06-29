const passport = require('passport');
const router = require('express').Router();
const { isAuth, isNotAuth } = require('../services/middleware');
const base64url = require('base64url');
const uuid = require('uuid').v4;
const User = require('../models/User');
const SessionChallengeStore = require('passport-fido2-webauthn').SessionChallengeStore;
const store = new SessionChallengeStore();


router.get('/home'), (req, res) => {
  res.redirect('/');
}

router.get('/resource', isAuth, (req, res, next) => {
  res.render('resource', {
    authenticated: req.isAuthenticated(),
    user: req.user
  });
});

router.get('/status', (req, res, next) => {
  res.render('status', {
    status: req,
    user: req.user
  });
});

router.get('/error', (req, res) => {
  res.render('error', {
    message_tag: 'Authentication Error',
    user: req.user
  });
});

router.get('/logout', (req, res) => {
  req.logout(req.user, (err) => { // Passport logout function
    if (err) {
      res.redirect('/error');
    }
    res.redirect('/status');
    console.log("User Authenticated:", req.isAuthenticated());
  });
});

router.get('/login', isNotAuth,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline', // Requests a refresh token
    prompt: 'consent'
  })
);

router.get('/success', (req, res) => {
  if (req.isAuthenticated()) {
    console.log("User Authenticated:", req.isAuthenticated());
    console.log('Session expires in:', req.session.cookie.maxAge / 1000);
    res.render('success', {
      message: 'Authorized!',
      user: req.user
    });
  } else {
    console.log("User Not Authenticated \nsessionID:", req.sessionID);
    console.log('Cookie:', req.session.cookie);
    res.redirect('/error');
  }
});

router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/error',
    keepSessionInfo: true // Used to keep session info on redirect
  }),
  (req, res) => {
    // Successful authentication, redirect to saved route or success.
    const returnTo = req.session.returnTo;
    delete req.session.returnTo;
    res.redirect(returnTo || '/success');
  });

  router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/success', {
        user: req.user
    });
    } else {
      let date = new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'full',
        timeStyle: 'long'
      }).format(new Date());
      res.render('index', {
        date_tag: date,
        message_tag: 'Access your Google Account',
        user: req.user
      });
    }
  });
  
  router.get('/signup', (req, res) => {
    res.render('signup', {
      user: req.user
    });
  });
  
  router.post('/signup/public-key/challenge', async function(req, res, next) {
    
    let handle = Buffer.alloc(16);
    handle = uuid({}, handle);
    
    const user = {
      id: handle,
      name: req.body.email,
      displayName: req.body.displayName
    };
  
    store.challenge(req, { user: user }, function(err, challenge) {
      if (err) { return next(err); }
  
      user.id = base64url.encode(user.id);
      res.json({ user: user, challenge: base64url.encode(challenge) });
    });
  });
  
  router.post('/login/public-key', passport.authenticate('webauthn', {
    failureMessage: true,
    failWithError: true
  }), function(req, res, next) {
    res.json({ ok: true, location: '/success' });
  
  }, function(err, req, res, next) {
    var cxx = Math.floor(err.status / 100);
    if (cxx != 4) { return next(err); }
  
    const message = req.authInfo ? req.authInfo.message : (req.session.messages && req.session.messages[0]);
  
    res.json({ ok: false, location: '/', message: message });
  });
  
  router.post('/login/public-key/challenge', function(req, res, next) {
    store.challenge(req, function(err, challenge) {
      if (err) { return next(err); }
  
      console.log('Challenge:', challenge);
  
      res.json({ challenge: base64url.encode(challenge) });
    });
  });
   

module.exports = router;