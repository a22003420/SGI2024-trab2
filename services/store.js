var SessionChallengeStore = require('passport-fido2-webauthn').SessionChallengeStore;
var store = new SessionChallengeStore();

module.exports = store;