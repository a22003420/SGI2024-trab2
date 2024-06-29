// window.addEventListener('load', function() { not working in this way with this code from Todos

//   document.getElementById('siw-public-key').addEventListener('click', function(event) {
//   const touchIdButton = document.getElementById('siw-public-key');

//   if (!touchIdButton) { return; }

window.addEventListener('load', function() {
  const touchIdButton = document.getElementById('siw-public-key');

  if (!touchIdButton) { return; }

 touchIdButton.addEventListener('click', function(event) {
    if (!window.PublicKeyCredential) {
      alert('Passkeys are not supported by this browser');
      return;
    }
    
    event.preventDefault();
    
    return fetch('/login/public-key/challenge', {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      return navigator.credentials.get({
        publicKey: {
          challenge: base64url.decode(json.challenge)
        }
      });
    })
    .then(function(credential) {
      var body = {
        id: credential.id,
        response: {
          clientDataJSON: base64url.encode(credential.response.clientDataJSON),
          authenticatorData: base64url.encode(credential.response.authenticatorData),
          signature: base64url.encode(credential.response.signature),
          userHandle: credential.response.userHandle ? base64url.encode(credential.response.userHandle) : null
        }
      };
      if (credential.authenticatorAttachment) {
        body.authenticatorAttachment = credential.authenticatorAttachment;
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
      if (json.ok) {
        return window.location.href = json.location;
      }

      alert(json.message);
    })
    .catch(function(error) {
      console.log(error);
    });
  });
});