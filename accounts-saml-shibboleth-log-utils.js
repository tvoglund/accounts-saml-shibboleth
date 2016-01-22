bDebug = false;
MyLogs = new Meteor.Collection("samlLogs");

// code to run on server at startup
if(Meteor.settings) {
    if(Meteor.settings['public']) {
        bDebug = Meteor.settings.public.debug == true;
    }
}

if (!Accounts.saml) {
    Accounts.saml = {};
}

Accounts.saml.debugLog = function(file,line,message,isError ){
    if(bDebug) {
        if(isError) {

            MyLogs.insert({
                file: file,
                line: line,
                error: message,
                info: 'na',
                date: new Date(Date.now())
            });
        }
        else{

            MyLogs.insert({
                file: file,
                line: line,
                error: 'na',
                info: message,
                date: new Date(Date.now())
            });
        }
    }
};