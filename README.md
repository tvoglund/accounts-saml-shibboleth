accounts-saml-shibboleth
=======

SAML v2 login support for existing password based accounts using Shibboleth IdP

Important Notes
-----------

this package is working with testShib.org IdP, but has not been tested with any other IdPs
this package is expecting an encrypted assertion

Usage
-----------

put saml settings in meteor.settings like so:

{
  "public": {
    "debug": "true"
  },
  "saml":[{
    "provider":"some-provider",
    "createUser": false,
    "profile": {
      "firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
      "lastName" : "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
    },
    "pem": "<add PEM Here>"
 }]
}

**debug = true will creaete a table that has log errors in it.
