// window.addEventListener('load', function() { // not working with this

//   document.querySelector('.signup-form').addEventListener('submit', function(event) {
//   const signUpForm = document.querySelector('.js-signup_form');

//   if (!signUpForm) { return; }


window.addEventListener('load', function() {
  const signUpForm = document.querySelector('.js-signup_form');

  if (!signUpForm) { return; }

  signUpForm.addEventListener('submit', function(event) {
    if (!window.PublicKeyCredential) { return; }
    
    event.preventDefault();
    
    return fetch('/signup/public-key/challenge', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: event.target.email.value,
        displayName: event.target.displayName.value
      }),
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      return navigator.credentials.create({
        publicKey: {
          rp: {
            name: 'test'
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
              alg: -7
            },
            {
              type: 'public-key',
              alg: -257 
            }
          ],
          authenticatorSelection: {
            residentKey: "required",
            userVerification: 'preferred',
          },
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
      
      return fetch('/login/public-key', {
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
      if(json.ok) {
        return window.location.href = json.location;
      }

      alert(json.message);
    })
    .catch(function(error) {
      console.log(error);
    });
  });
});