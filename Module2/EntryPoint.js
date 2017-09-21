console.log("Loading Settings...")
var fs = require('fs');

var HashMap=require('hashmap');
var Module2=require('./Module2');
var userProcessor = new HashMap();
fs.readFile('../../dbaccess.json', function (err, logData) 
{
    if (err) throw err;
    var text = logData.toString();
    dbAccess=JSON.parse(text);
    fs.readFile('config.json', function (err, logData) 
    {
        if (err) throw err;
        var text = logData.toString();
        ConfigdataObj=JSON.parse(text);
        userProcessor.set(1,ConfigdataObj.filename);
        userProcessor.set(89765,ConfigdataObj.languages);
        Module2.extract(userProcessor,dbAccess,ConfigdataObj,function()
        {
            console.log("Ended");
                //estrai da userProcessor e salva gli utenti di interesse
        });
    }); 
});