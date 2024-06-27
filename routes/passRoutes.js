const { isAuth } = require('../services/middleware');
const test = require('../services/store');
const base64url = require('base64url');
const passport = require('passport');
const router = require('express').Router();

// start of webauthn routes 

router.post('/login/public-key/challenge', function(req, res, next) { // here
    store.challenge(req, function(err, challenge) {
      if (err) { return next(err); }
      res.json({ challenge: base64url.encode(challenge) });
    });
  });

router.get('/login', function(req, res, next) { // here
    res.render('login');
  });
  
router.post('/login/public-key', passport.authenticate('webauthn', { // here
    failureMessage: true,
    failWithError: true
  }), function(req, res, next) {
    res.json({ ok: true, location: '/success' });
  }, function(err, req, res, next) {
    var cxx = Math.floor(err.status / 100);
    if (cxx != 4) { return next(err); }
    res.json({ ok: false, location: '/login' });
  });
 
  
  router.post('/passport-auth/public-key/challenge', function(req, res, next) {
    store.challenge(req, function(err, challenge) {
      if (err) { return next(err); }
      res.json({ challenge: base64url.encode(challenge) });
    });
  });



router.get('/signup', isAuth, (req, res) => { // here 

    res.render('signup', {
      user: req.user
    });
  });
  
  router.post('/signup/public-key/challenge', async function(req, res, next) { //here
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
      //var challenge = await new Promise((resolve, reject) => {
        //setTimeout(() => {
          // Força um erro de exemplo || test
          //reject(new Error('Erro simulado'));
        //}, 1000);
      //});
  
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