## accounts-saml-shibboleth

SAML v2 login support for existing password based accounts using Shibboleth IdP

### Important Notes

This package is working with testShib.org IdP, but has not been tested with any other IdPs  
This package is expecting an encrypted assertion  

### Usage

put saml settings in meteor.settings like so:  

{  
"public":
{
"debug": true
},
"saml":[
{
"provider":"some-provider",
"createUser": false,
"profile": {
"firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
"lastName" : "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
},
"pem": "-----BEGIN RSA PRIVATE KEY----- ...... ==-----END RSA PRIVATE KEY-----""
"entryPoint":"https://idp.testshib.org/idp/profile/SAML2/Redirect/SSO",
"issuer": "https://some.website.com/shibboleth-sp",
"cert":"remove -----BEGIN CERTIFICATE----- at the begging and -----END CERTIFICATE----- at the end
}
]
}  

**debug = true will creaete a table that has log errors in it.  


in some template add a button with click event

in helper function  

'click .saml-login': function(event, template){
var provider = "some-provider";
Meteor.loginWithSaml({
provider:provider
}, function(error, result){
//handle errors and result
});
}
