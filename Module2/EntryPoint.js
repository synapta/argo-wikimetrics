console.log("Loading Settings...")
var fs = require('fs');
var Client = require('mariasql');
var HashMap=require('hashmap');
var Module2=require('./Module2');
var userProcessor = new HashMap();
fs.readFile('../../dbaccess.json', function (err, logData) 
{
    if (err) throw err;
    var text = logData.toString();
    dbAccess=JSON.parse(text);
    var wikiCaller = new Client
    (
        {
            host: dbAccess.remote,
            user: dbAccess.user,
            password: dbAccess.password
        }
    );   
    fs.readFile('config.json', function (err, logData) 
    {
        if (err) throw err;
        var text = logData.toString();
        ConfigdataObj=JSON.parse(text);
        userProcessor.set(1,ConfigdataObj.filename);
        userProcessor.set(89765,ConfigdataObj.languages);
        Module2.extract(userProcessor,wikiCaller,ConfigdataObj,function()
        {
                //estrai da userProcessor e salva gli utenti di interesse
        });
    }); 
});