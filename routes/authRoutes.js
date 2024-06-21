const passport = require('passport');
const router = require('express').Router();
const { isAuth, isNotAuth } = require('../services/middleware');
const Item = require('../models/Item');


var WebAuthnStrategy = require('passport-fido2-webauthn');
var SessionChallengeStore = require('passport-fido2-webauthn').SessionChallengeStore;
var base64url = require('base64url');
var uuid = require('uuid').v4;


var store = new SessionChallengeStore();

// Home page route
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/success');
    } else {
        let date = new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'full',
            timeStyle: 'long'
        }).format(new Date());
        res.render('index', {
            date_tag: date,
            message_tag: 'Choose an option below to continue.',
        });
    }
});

// Redirect home route
router.get('/home', (req, res) => {
    res.redirect('/');
});

// Success page route
router.get('/success', (req, res) => {
    if (req.isAuthenticated()) {
        console.log("User Authenticated:", req.isAuthenticated());
        console.log('Session expires in:', req.session.cookie.maxAge / 1000);
        res.render('success', {
            message: 'Authorization Successful!',
            user: req.user
        });
    } else {
        console.log("User Not Authenticated \nsessionID:", req.sessionID);
        console.log('Cookie:', req.session.cookie);
        res.redirect('/error');
    }
});

// Protected resource route
router.get('/resource', isAuth, (req, res) => {
    res.render('resource', {
        authenticated: req.isAuthenticated()
    });
});

// Items list route
router.get('/items', isAuth, async (req, res) => {
    const items = await Item.find().populate('createdBy').exec();
    res.render('items', {
        items: items
    });
});

// Create item route (POST)
router.post('/items/create', isAuth, async (req, res) => {
    console.log('Request Body:', req.body);

    const { title, description } = req.body;

    // Check if title and description are present in the request body
    if (!title || !description) {
        return res.status(400).send('Title and description are required');
    }

    try {
        const newItem = new Item({
            title,
            description,
            dataCreation: new Date(),
            createdBy: req.user._id
        });
        await newItem.save();
        res.redirect('/items'); // Redirect to the items list page
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Create item form route (GET)
router.get('/items/create', isAuth, async (req, res) => {
    try {
        const items = await Item.find().populate('createdBy').exec();
        res.render('itemsCreate', { items: items });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Delete item confirmation route (GET)
router.get('/items/:id/delete', isAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        const item = await Item.findById(itemId); // Find item by ID
        if (!item) {
            return res.status(404).send('Item not found');
        }
        res.render('confirmDelete', { item: item }); // Render confirmation page
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Delete item route (POST)
router.post('/items/:id/delete', isAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        await Item.findByIdAndDelete(itemId); 
        res.redirect('/items'); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Edit item form route (GET)
router.get('/items/:id/edit', isAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).send('Item not found');
        }
        res.render('editItem', { item: item });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Edit item route (POST)
router.post('/items/:id/edit', isAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        const { title, description} = req.body;
        await Item.findByIdAndUpdate(itemId, { title, description});
        res.redirect('/items');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Status page route
router.get('/status', (req, res) => {
    res.render('status', {
        status: req
    });
});

// Error page route
router.get('/error', (req, res) => {
    res.render('error', {
        message_tag: 'Authentication Error'
    });
});

// Logout route
router.get('/logout', (req, res) => {
    req.logout((err) => { // Passport logout function
        if (err) {
            console.error('Error during logout:', err);
            return res.redirect('/error');
        }
        req.session.destroy((err) => { // Destroy session
            if (err) {
                console.error('Error destroying session:', err);
                return res.redirect('/error');
            }
            res.clearCookie('connect.sid', { path: '/' }); // Clear session cookie
            res.redirect('/');
            console.log("User authenticated:", req.isAuthenticated());
        });
    });
});

// Google login route
router.get('/login', isNotAuth, passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline', // Requests a refresh token
    prompt: 'consent'
}));

// Google auth callback route
router.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/error',
    keepSessionInfo: true // Used to keep session info on redirect
}), (req, res) => {
    // Successful authentication, redirect to saved route or success.
    const returnTo = req.session.returnTo;
    delete req.session.returnTo;
    res.redirect(returnTo || '/success');
});

// start of webauthn routes 

router.get('/passport-auth', function(req, res, next) {
    res.render('login');
  });


router.post('/passport-auth/public-key', passport.authenticate('webauthn', {
    failureMessage: true,
    failWithError: true
  }), function(req, res, next) {
    res.json({ ok: true, location: '/' });
  }, function(err, req, res, next) {
    var cxx = Math.floor(err.status / 100);
    if (cxx != 4) { return next(err); }
    res.json({ ok: false, location: '/passport-auth' });
  });
  
  router.post('/passport-auth/public-key/challenge', function(req, res, next) {
    store.challenge(req, function(err, challenge) {
      if (err) { return next(err); }
      res.json({ challenge: base64url.encode(challenge) });
    });
  });

  router.get('/signup', function(req, res, next) {
    res.render('signup');
  });
  
  router.post('/signup/public-key/challenge', async function(req, res, next) {
    try {
      console.log("signup challenge");
      var handle = Buffer.alloc(16);
      handle = uuid({}, handle);
      console.log("handle:", handle);
      var user = {
        id: handle,
        name: req.body.name,
        displayName: req.body.name
      };

      // console.log(req.body.name)
      console.log(req.body)
      console.log("user:", user);
      // Simula uma operação assíncrona com uma promise
      var challenge = await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Força um erro de exemplo
          reject(new Error('Erro simulado'));
        }, 1000);
      });
  
      // Encode o ID e o desafio em base64url
      user.id = base64url.encode(user.id);
      var encodedChallenge = base64url.encode(challenge);
  
      // Envia a resposta JSON com o user e o desafio codificado
      res.json({ user: user, challenge: encodedChallenge });
    } catch (err) {
      // Se ocorrer um erro, captura o erro e passa para o próximo handler de erro (next)
      next(err);
    }
  });
  

module.exports = router;
