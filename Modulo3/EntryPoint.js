var Module3=require('./Module3');
var HashMap=require('hashmap');
var fs=require('fs');
var userProcessor=new HashMap();
fs.readFile('config.json', function (err, logData) 
{
    if (err) throw err;
    var text = logData.toString();
    var ConfigdataObj=JSON.parse(text);
    fs.readFile(ConfigdataObj.databaseconfig, function (err, logData) 
    {
        if (err) throw err;
        var text = logData.toString();
        dbAccess=JSON.parse(text);
        Module3.init(ConfigdataObj,dbAccess,userProcessor,function(){
            //SAVE USERS
        });
    });
});


