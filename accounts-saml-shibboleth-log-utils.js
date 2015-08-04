bDebug = false;
MyLogs = new Meteor.Collection("samlLogs");

// code to run on server at startup
if(Meteor.settings) {
    if(Meteor.settings['public']) {
        bDebug = Meteor.settings.public.debug == "true";
    }
}

if (!Accounts.saml) {
    Accounts.saml = {};
}

Accounts.saml.debugLog = function(file,line,message,isError ){
    var date = new Date();
    var n = date.toDateString();
    var time = date.toLocaleTimeString();

    if(bDebug) {
        if(isError) {
            MyLogs.insert({
                file: file,
                line: line,
                error: message,
                info: 'na',
                date: n + ' ' + time
            });
        }
        else{
            MyLogs.insert({
                file: file,
                line: line,
                error: 'na',
                info: message,
                date: n + ' ' + time
            });
        }
    }
};