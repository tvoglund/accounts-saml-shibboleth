var zlib = Npm.require('zlib');
var xmlCrypto = Npm.require('xml-crypto');
var crypto = Npm.require('crypto');
var xmldom = Npm.require('xmldom');
var querystring = Npm.require('querystring');
var xmlencryption = Npm.require('xml-encryption');
var xpath  = Npm.require('xpath');
var fs =  Npm.require('fs');

SAML = function (options) {
  this.options = this.initialize(options);
};

SAML.prototype.initialize = function (options) {
  if (!options) {
    options = {};
  }

  if (!options.protocol) {
    options.protocol = 'https://';
  }

  if (!options.path) {
    options.path = '/saml/consume';
  }

  if (!options.issuer) {
    options.issuer = 'onelogin_saml';
  }

  if (options.identifierFormat === undefined) {
    options.identifierFormat = "urn:oasis:names:tc:SAML:2.0:nameid-format:transient";
    //options.identifierFormat = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress";
  }

  return options;
};

SAML.prototype.generateUniqueID = function () {
  var chars = "abcdef0123456789";
  var uniqueID = "";
  for (var i = 0; i < 20; i++) {
    uniqueID += chars.substr(Math.floor((Math.random()*15)), 1);
  }
  return uniqueID;
};

SAML.prototype.generateInstant = function () {
  //var date = new Date();
  //return date.getUTCFullYear() + '-' + ('0' + (date.getUTCMonth()+1)).slice(-2) + '-' + ('0' + date.getUTCDate()).slice(-2) + 'T' + ('0' + (date.getUTCHours()+2)).slice(-2) + ":" + ('0' + date.getUTCMinutes()).slice(-2) + ":" + ('0' + date.getUTCSeconds()).slice(-2) + "Z";
    return new Date().toISOString();
};

SAML.prototype.signRequest = function (xml) {
  var signer = crypto.createSign('RSA-SHA1');
  signer.update(xml);
  return signer.sign(this.options.privateCert, 'base64');
}

SAML.prototype.generateAuthorizeRequest = function (req) {
  var id = "_" + this.generateUniqueID();
  var instant = this.generateInstant();

  // Post-auth destination
  if (this.options.callbackUrl) {
    callbackUrl = this.options.callbackUrl;
  } else {
    var callbackUrl = this.options.protocol + req.headers.host + this.options.path;
  }

  if (this.options.id)
    id = this.options.id;

  var request =
   "<samlp:AuthnRequest xmlns:samlp=\"urn:oasis:names:tc:SAML:2.0:protocol\" ID=\"" + id + "\" Version=\"2.0\" IssueInstant=\"" + instant +
   "\" ProtocolBinding=\"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST\" AssertionConsumerServiceURL=\"" + callbackUrl + "\" Destination=\"" +
   this.options.entryPoint + "\">" +
    "<saml:Issuer xmlns:saml=\"urn:oasis:names:tc:SAML:2.0:assertion\">" + this.options.issuer + "</saml:Issuer>\n";

  if (this.options.identifierFormat) {
    request += "<samlp:NameIDPolicy xmlns:samlp=\"urn:oasis:names:tc:SAML:2.0:protocol\" Format=\"" + this.options.identifierFormat +
    "\" AllowCreate=\"true\"></samlp:NameIDPolicy>\n";
  }

  request +=
    "<samlp:RequestedAuthnContext xmlns:samlp=\"urn:oasis:names:tc:SAML:2.0:protocol\" Comparison=\"exact\">" +
    "<saml:AuthnContextClassRef xmlns:saml=\"urn:oasis:names:tc:SAML:2.0:assertion\">urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef></samlp:RequestedAuthnContext>\n" +
  "</samlp:AuthnRequest>";

  return request;
};

SAML.prototype.generateLogoutRequest = function (req) {
  var id = "_" + this.generateUniqueID();
  var instant = this.generateInstant();

  //samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  // ID="_135ad2fd-b275-4428-b5d6-3ac3361c3a7f" Version="2.0" Destination="https://idphost/adfs/ls/"
  //IssueInstant="2008-06-03T12:59:57Z"><saml:Issuer>myhost</saml:Issuer><NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
  //NameQualifier="https://idphost/adfs/ls/">myemail@mydomain.com</NameID<samlp:SessionIndex>_0628125f-7f95-42cc-ad8e-fde86ae90bbe
  //</samlp:SessionIndex></samlp:LogoutRequest>

  var request = "<samlp:LogoutRequest xmlns:samlp=\"urn:oasis:names:tc:SAML:2.0:protocol\" "+
    "xmlns:saml=\"urn:oasis:names:tc:SAML:2.0:assertion\" ID=\""+id+"\" Version=\"2.0\" IssueInstant=\""+instant+
    "\" Destination=\""+this.options.entryPoint + "\">" +
    "<saml:Issuer xmlns:saml=\"urn:oasis:names:tc:SAML:2.0:assertion\">" + this.options.issuer + "</saml:Issuer>"+
    "<saml:NameID Format=\""+req.user.nameIDFormat+"\">"+req.user.nameID+"</saml:NameID>"+
    "</samlp:LogoutRequest>";
  return request;
}

SAML.prototype.requestToUrl = function (request, operation, callback) {

  var self = this;
  zlib.deflateRaw(request, function(err, buffer) {

    if (err) {
      return callback(err);
    }

    var base64 = buffer.toString('base64');
    var target = self.options.entryPoint;

    if (operation === 'logout') {
      if (self.options.logoutUrl) {
        target = self.options.logoutUrl;
      }
    }

    if(target.indexOf('?') > 0)
      target += '&';
    else
      target += '?';

    var samlRequest = {
      SAMLRequest: base64
    };

    if (self.options.privateCert) {
      samlRequest.SigAlg = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
      samlRequest.Signature = self.signRequest(querystring.stringify(samlRequest));
    }
    target += querystring.stringify(samlRequest);

    callback(null, target);
  });
}

SAML.prototype.getAuthorizeUrl = function (req, callback) {
  var request = this.generateAuthorizeRequest(req);

  this.requestToUrl(request, 'authorize', callback);
};

SAML.prototype.getLogoutUrl = function(req, callback) {
  var request = this.generateLogoutRequest(req);

  this.requestToUrl(request, 'logout', callback);
}

SAML.prototype.certToPEM = function (cert) {
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = "-----BEGIN CERTIFICATE-----\n" + cert;
  cert = cert + "\n-----END CERTIFICATE-----\n";
  return cert;
};

SAML.prototype.validateSignature = function (xml, cert) {
  var self = this;
  var doc = new xmldom.DOMParser().parseFromString(xml);
  var signature = xmlCrypto.xpath(doc, "//*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']")[0];
  var sig = new xmlCrypto.SignedXml();
  sig.keyInfoProvider = {
    getKeyInfo: function (key) {
      return "<X509Data></X509Data>"
    },
    getKey: function (keyInfo) {
      return self.certToPEM(cert);
    }
  };
  sig.loadSignature(signature.toString());
  return sig.checkSignature(xml);
};

SAML.prototype.getElement = function (parentElement, elementName) {
  if (parentElement['saml:' + elementName]) {
    return parentElement['saml:' + elementName];
  } else if (parentElement['samlp:'+elementName]) {
    return parentElement['samlp:'+elementName];
  } else if (parentElement['saml2p:'+elementName]) {
    return parentElement['saml2p:'+elementName];
  } else if (parentElement['saml2:'+elementName]) {
    return parentElement['saml2:'+elementName];
  }
  return parentElement[elementName];
}

SAML.prototype.validateResponse = function (samlResponse, callback) {
    var self = this;
    var xmlDomDoc = new xmldom.DOMParser().parseFromString(samlResponse);

    try {
        // Verify signature
        //if (self.options.cert && !self.validateSignature(xml, self.options.cert)) {
        //    return callback(new Error('Invalid signature'), null, false);
        //}

        var assertion = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='Assertion']");
        if (assertion) {
            profile = {};

            var conditions = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='Assertion']/*[local-name(.)='Subject']");
            var authnStatement = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='Assertion']/*[local-name(.)='AuthnStatement']");

            //Get InResponseTo
            //sample...  1ed79ec15dfd
            var inResponseTo = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='SubjectConfirmationData']/@InResponseTo");
            if (inResponseTo) {
                profile.inResponseToId = inResponseTo[0].nodeValue;
            }

            //Get Issuer
            //sample...  https://idp.testshib.org/idp/shibboleth
            //Get Issuer
            //sample...  https://idp.testshib.org/idp/shibboleth
            var issuer = xpath.select("//*[local-name(.)='Assertion']/*[local-name(.)='Issuer']/text()",xmlDomDoc);
            if (issuer) {
                profile.issuer = issuer[0].nodeValue;
            }

            //Get NameID
            //sample...
            var nameID = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='Assertion']/*[local-name(.)='Subject']/*[local-name(.)='NameID']/text()");
            if (nameID) {
                profile.nameID = nameID[0].nodeValue;

                var nameIDNode = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='Assertion']/*[local-name(.)='Subject']/*[local-name(.)='NameID']/@Format");
                if (nameIDNode[0]) {
                    profile.nameIDFormat = nameIDNode[0].nodeValue;
                }
            }

            var attributeStatement = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='Assertion']/*[local-name(.)='AttributeStatement']");
            if (attributeStatement[0].childNodes) {
                xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='Assertion']/*[local-name(.)='AttributeStatement']/*[local-name(.)='Attribute']").forEach(function(item, count){
                    var profileKey = null;
                    for(var key in item.attributes){
                        if(item.attributes[key].nodeName == 'FriendlyName'){
                            profileKey = item.attributes[key].nodeValue;
                        }
                    }
                    if(profileKey) {
                        profile[profileKey] = item.firstChild.firstChild.nodeValue;
                    }
                });

                if (!profile.mail && profile['urn:oid:0.9.2342.19200300.100.1.3']) {
                    // See http://www.incommonfederation.org/attributesummary.html for definition of attribute OIDs
                    profile.mail = profile['urn:oid:0.9.2342.19200300.100.1.3'];
                }

                if (!profile.email && profile.mail) {
                    profile.email = profile.mail;
                }
            }

            if (!profile.email && profile.nameID && profile.nameIDFormat && profile.nameIDFormat.indexOf('emailAddress') >= 0) {
                profile.email = profile.nameID;
            }

            //truby added to handle TestShib.org
            if(!profile.email && profile.uid){
                profile['email'] = profile.uid + '@test.com';
            }

            callback(null, profile, false);
        } else {
            var logoutResponse = self.getElement(xmlDomDoc, 'LogoutResponse');
            Accounts.saml.debugLog('saml_utils.js', '279', 'Unknown SAML response message', true);

            if (logoutResponse) {
                callback(null, null, true);
            } else {
                return callback(new Error('Unknown SAML response message'), null, false);
            }

        }
    }
    catch(error){
        Accounts.saml.debugLog('saml_utils.js', '290', 'Unknown SAML response message.. Error: ' + error, true);

        return callback(new Error('Unknown SAML response message'), null, false);
    }
};

//TRuby added below.
SAML.prototype.decryptSAMLResponse = function (samlResponse){
    var self = this;
    var xml = new Buffer(samlResponse, 'base64').toString();

    try{
        var xmlDomDoc = new xmldom.DOMParser().parseFromString(xml);
        var encryptedDataNode  = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='EncryptedData' and namespace-uri(.)='http://www.w3.org/2001/04/xmlenc#']")[0];
        var encryptedData = encryptedDataNode.toString();
        //var privateCert = '-----BEGIN RSA PRIVATE KEY-----MIICXgIBAAKBgQDBGsKZ7XrLGIjLIQ+JYwBU4zD+Ph/hXc33RWZ3wMnvAbR0eGjOkB5DnxM0aODGeplQoYyd0lcqDbtnX5HHNtT3mnoOgO2kJQbHWBRa+5Jc8KtuzXCxBXHRPtlCRnxitU5MlgwjASVDG6xlWE2mwAq8efcxsxsNemjxhZADdSurXQIDAQABAoGBAKwjI7g9p0mmnEKfPQ9WjnQddo4daSPoD/PODNLRq/EADxIISD1i4WecRW1h1IV5wnPLHuONHqBhT16OJhB1A5AM3mLeAk/aiSssAhaBLkjDwFZM/8/KdBBYfYjQ3FNbolIovWcixAQloM6A2pXGINjWEHKiVy+XV6lvhTP8BVVBAkEA3+WblPQoUdyPPn6XLaZUQlqxCkWwZYb7/BWHPHVFwo4f57s86ckWvPh7Kyhm1EZpfugFpkYtElvqFsA8RJK57QJBANzK4hLQ0KkouwUPBDxlrZaJzaHogJlzPIP29Gbqn/TnVTbKXjSDQtIGEnCEpawD2ZZBO7L5r4Fr5maQ+kYnyTECQQDJhRU6xWOBAt7fJfuWN+4A5zYQA9eYGh21r/7P2NHYIinvXiSeW8MehRv/JVcgWtvbQKTNGr64logkwBO+uL2lAkEAm6naW8Om6SxTNozQwrg4+2JqfNUMHaPWLX/l7c1LOwIB3SAt7L4CVUp8o6GRoEYSmNGjAlrw9sEY7oUWPnH8cQJAeltVoWLKOHrQa6qERTaNHY+Oqv+fbW0I3yS1lTlhhfYLMO8HrQbppSBdttgpFLA/WWrzA99VGcl9W4878ByLAw==-----END RSA PRIVATE KEY-----';//fs.readFileSync('/Users/tvoglund/Documents/Projects/Deployments/ShibbolethTest/x509/privatekey.pem', 'utf-8');
        var privateCert = this.options.pem;
        var decryptOptions = { key: privateCert};
        var resultObj = self.decryptSAML(encryptedData,decryptOptions);

       if(resultObj.err){
           return null;
       }
        else {
           Accounts.saml.debugLog('saml_utils.js', '314', 'decryptSAMLResponse: ' + resultObj.result, false);
           return resultObj.result;
       }
    }
    catch(error){
        Accounts.saml.debugLog('saml_utils.js', '320', 'error: ' + error, true);
        return null;
    }
}

SAML.prototype.decryptSAML = function(xml, options) {
    Accounts.saml.debugLog('saml_utils.js', 'decryptSAML', false);

    if (!options) {
        return {
            err: new Error('must provide options'),
            result :null
        };
    }
    if (!xml) {
        return {
            err: new Error('must provide XML to encrypt'),
            result :null
        };
    }
    if (!options.key) {
        return {
            err: new Error('key option is mandatory and you should provide a valid RSA private key'),
            result :null
        };
    }
    var doc = new xmldom.DOMParser().parseFromString(xml);

    var symmetricKey = xmlencryption.decryptKeyInfo(doc, options);
    var encryptionMethod = xpath.select("/*[local-name(.)='EncryptedData']/*[local-name(.)='EncryptionMethod']", doc)[0];
    var encryptionAlgorithm = encryptionMethod.getAttribute('Algorithm');
    var encryptedContent = xpath.select("/*[local-name(.)='EncryptedData']/*[local-name(.)='CipherData']/*[local-name(.)='CipherValue']", doc)[0];
    var encrypted = new Buffer(encryptedContent.textContent, 'base64');
    var decrypted;
    var decipher;

    switch (encryptionAlgorithm) {
        case 'http://www.w3.org/2001/04/xmlenc#aes256-cbc':
            decipher = crypto.createDecipheriv('aes-256-cbc', symmetricKey, encrypted.slice(0, 16));
            break;
        case 'http://www.w3.org/2001/04/xmlenc#aes128-cbc':
            decipher = crypto.createDecipheriv('aes-128-cbc', symmetricKey, encrypted.slice(0, 16));
            break;
        default:
            throw new Error('encryption algorithm ' + encryptionAlgorithm + ' not supported');
    }

    decipher.setAutoPadding(auto_padding=false);
    decrypted = decipher.update(encrypted.slice(16), 'base64', 'utf8') + decipher.final('utf8') ;

    //remove anything after </saml2:Assertion>  //test shib had a few binary characters after this..
    decrypted = decrypted.substring(0,decrypted.indexOf('</saml2:Assertion>')) + '</saml2:Assertion>';

    return {
        err: null,
        result :decrypted
    };
};

SAML.prototype.checkSAMLStatus = function (xmlDomDoc) {
    var status = {StatusCodeValue:null, StatusMessage:null, StatusDetail:null}

    var statusCodeValueNode = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='StatusCode']")[0];
    if(statusCodeValueNode)
    {
        status.StatusCodeValue  = statusCodeValueNode.getAttribute('Value');
    }

    var statusMessageNode = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='StatusMessage']")[0];
    if(statusMessageNode)
    {
        status.StatusMessage  = statusMessageNode.childNodes[0].nodeValue;
    }

    var statusDetailNode = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='StatusDetail']/*[local-name(.)='Cause']")[0];
    if(statusDetailNode)
    {
        status.StatusDetail  = statusDetailNode.childNodes[0].nodeValue;
    }
    //status.StatusMessage = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='StatusMessage']")[0].childNodes[0].nodeValue;
    //status.StatusDetail = xmlCrypto.xpath(xmlDomDoc, "//*[local-name(.)='StatusDetail']/*[local-name(.)='Cause']")[0].childNodes[0].nodeValue;
    return status;
};