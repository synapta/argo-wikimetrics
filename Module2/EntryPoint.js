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
        Module2.extract(userProcessor,dbAccess,ConfigdataObj,function()
        {
            console.log("Ended");
            users=userProcessor.values();
            users.sort(function(a, b){return -a.edits+b.edits});
            console.log(users);
            //filter
            filteredUsers=[];
            var FUindex=0;
            var Uindex=0;
            Fstream=fs.createWriteStream(ConfigdataObj.filepath+ConfigdataObj.filename+"_OUT.csv", {'flags': 'w'});
            for(Uindex=0;Uindex<users.length;Uindex++)
            {
                DU=users[Uindex];
                if(DU.edits>50&&DU.maxEdit>300&&!DU.name.toLowerCase().includes("bot"))
                {
                    filteredUsers[FUindex]=DU;
                    Fstream.write(DU.name+","+DU.edits+","+DU.maxEdit+"\n");
                    FUindex++;
                }
            }
            Fstream.end("");
            console.log(filteredUsers);
            return;
        });
    }); 
});