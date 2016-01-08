Package.describe({
    name:"tvoglund:accounts-saml-shibboleth",
    summary: "saml login provider for meteor developed for Shibboleth with encrypted Assertion",
    version: "0.0.11",
    git: "https://github.com/tvoglund/accounts-saml-shibboleth",
    documentation: 'README.md'
});

Package.on_use(function (api) {
    api.versionsFrom("METEOR@1.1.0.2");
    api.use(['routepolicy','webapp','underscore', 'service-configuration'], 'server');
    api.use(['http','accounts-base'], ['client', 'server']);

    api.add_files(['accounts-saml-shibboleth-server.js','accounts-saml-shibboleth-utils.js'], 'server');
	api.add_files('accounts-saml-shibboleth-client.js', 'client');
    api.add_files('accounts-saml-shibboleth-log-utils.js', ['client', 'server']);
});

Npm.depends({
	"xml2js": "0.2.0",
    "xml-crypto": "0.0.20",
    "xmldom": "0.1.19",
    "connect": "2.7.10",
    "xml-encryption": "0.7.2",
    "xpath": "0.0.5",
});
