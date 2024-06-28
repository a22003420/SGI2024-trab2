window.addEventListener('DOMContentLoaded', function() {
  
  document.querySelector('form').addEventListener('submit', function(event) {
    if (!window.PublicKeyCredential) { return; }
    
    event.preventDefault();
    screen.orientation.lock('portrait').catch(function(error) {
      console.log(error);
  });
    
    fetch('/signup/public-key/challenge', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.fromEntries(new FormData(event.target))),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro na solicitação: ' + response.status);
      }
      return response.json();
    })
    .then(json => {
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
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 } // RS256
          ],
          authenticatorSelection: {
            userVerification: 'preferred' // Preferência por verificação de usuário
          }
        }
      });
    })
    .then(credential => {
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
    .then(response => {
      return response.json();
    })
    .then(json => {
      window.location.href = json.location;
    })
    .catch(error => {
      console.error('Erro:', error);
    });
  });
  
});
