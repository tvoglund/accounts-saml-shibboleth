## accounts-saml-shibboleth

SAML v2 login support for existing password based accounts using Shibboleth IdP

### Important Notes

This package is working with testShib.org IdP, but has not been tested with any other IdPs  
This package is expecting an encrypted assertion  

### Usage

put saml settings in meteor.settings like so:  

{
  "public": {
    "debug": true,
  },
  "bUseTestShib": true,
  "saml":[{
    "provider":"shibboleth-idp",
    "profile": {
      "firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
      "lastName" : "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
    },
    "authFields":{
      "fname": "uid",
      "dbField": "username"
    },
    "pem": "-----BEGIN RSA PRIVATE KEY-----SomeKeyHere-----END RSA PRIVATE KEY-----",
    "entryPoint":"https://shibboleth.uwyo.edu/idp/profile/SAML2/Redirect/SSO",
    "issuer": "https://www.yourdomain.com/shibboleth-sp"
 }]
}

Note:  debug = true will create a table that has log errors in it.  The authFields fname is the friendlyName of attribute in saml assertion and dbField is the field to search for in meteor users ( Meteor.users.findOne({ dbField: <value of> fname}) ).  AuthFields is optional, you can remove authFields and it will default to emails.address as the dbField and the email in the assertion for the login process.  bUseTestShib attribute is boolean and is used to state if this package is being used with www.testShib.org.  See the website https://spaces.internet2.edu/display/InCFederation/Key+Generation for information on the pem.  This help page will guide you in creating the x509 certificate needed in the shibboleth metadata, and then how to create the key.pem for this file.  You will need to run the second command for decrypting the key.pem to paste in the settings.json file.


Then in some template add a button with click event that will call:

'click .saml-login': function(event, template){
var provider = "some-provider";
Meteor.loginWithSaml({
provider:provider
}, function(error, result){
//handle errors and result
});
}
