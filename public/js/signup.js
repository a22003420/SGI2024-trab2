window.addEventListener('load', function() {
  const signUpForm = document.querySelector('.js-signup_form');

  if (!signUpForm) { return; }

  signUpForm.addEventListener('submit', function(event) {
    if (!window.PublicKeyCredential) { return; }
    
    event.preventDefault();
    
    return fetch('/signup/public-key/challenge', { // check here
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: event.target.name.value,
        displayName: event.target.username.value
      }),
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      // https://chromium.googlesource.com/chromium/src/+/master/content/browser/webauth/uv_preferred.md
      // https://chromium.googlesource.com/chromium/src/+/main/content/browser/webauth/pub_key_cred_params.md
      return navigator.credentials.create({
        publicKey: {
          rp: {
            name: 'Todos'
          },
          user: {
            id: base64url.decode(json.user.id),
            name: json.user.name,
            displayName: json.user.displayName
          },
          challenge: base64url.decode(json.challenge),
          pubKeyCredParams: [
            {
              type: 'public-key',
              alg: -7 // ES256
            },
            {
              type: 'public-key',
              alg: -257 // RS256
            }
          ],
          //attestation: 'none',
          authenticatorSelection: {
            //authenticatorAttachment: 'platform', // "platform" | "cross-platform"
            //residentKey: 'discouraged', // "discouraged" | "preferred" | "required"
            //requireResidentKey: false, // true | false (default)
            userVerification: 'preferred', // "required" | "preferred" (default) | "discouraged"
          },
          //extensions: {
          //  credProps: true
          //}
        }
      });
    })
    .then(function(credential) {
      var body = {
        response: {
          clientDataJSON: base64url.encode(credential.response.clientDataJSON),
          attestationObject: base64url.encode(credential.response.attestationObject)
        }
      };
      if (credential.response.getTransports) {
        body.response.transports = credential.response.getTransports();
      }
      
      return fetch('/passport-auth/public-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      window.location.href = json.location;
    })
    .catch(function(error) {
      console.log(error);
    });
  });
  
});