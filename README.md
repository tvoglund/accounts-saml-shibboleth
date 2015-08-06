accounts-saml-shibboleth
=======

SAML v2 login support for existing password based accounts using Shibboleth IdP

Important Notes
-----------

This package is working with testShib.org IdP, but has not been tested with any other IdPs  
This package is expecting an encrypted assertion  

Usage
-----------

put saml settings in meteor.settings like so:  

{  
&nbsp;&nbsp;"public":  
&nbsp;&nbsp;{  
&nbsp;&nbsp;&nbsp;&nbsp;"debug": "true"  
&nbsp;&nbsp;},  
&nbsp;&nbsp;"saml":[  
&nbsp;&nbsp;&nbsp;&nbsp;{  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"provider":"some-provider",  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"createUser": false,  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"profile": {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"lastName" : "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"  
&nbsp;&nbsp;&nbsp;&nbsp;},  
&nbsp;&nbsp;&nbsp;&nbsp;"pem": "-----BEGIN RSA PRIVATE KEY----- ...... ==-----END RSA PRIVATE KEY-----""
&nbsp;&nbsp;&nbsp;&nbsp;"entryPoint":"https://idp.testshib.org/idp/profile/SAML2/Redirect/SSO",
&nbsp;&nbsp;&nbsp;&nbsp;"issuer": "https://sso.tuapath.com/shibboleth-sp",
&nbsp;&nbsp;&nbsp;&nbsp;"cert":"remove -----BEGIN CERTIFICATE----- at the begging and -----END CERTIFICATE----- at the end
&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;]  
}  

**debug = true will creaete a table that has log errors in it.  
