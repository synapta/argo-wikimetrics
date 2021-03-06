//INCLUDES
var fs = require('fs');
var HashMap = require('hashmap');
var lineByLine = require('n-readlines');
var Client = require('mariasql');
var utf8 = require('utf8');
//CONSTANTS
const traductionLines = 200;
//GLOBALS
var userProcessor;
var wikiCaller = null;
var ConfigDataObj;
var langIndex;
var liner;
var callbackEP;
var DBAccess;
var packnum = 0;
//FUNCTIONS
var extract = function (userProc, dBAccess, ConfigData, callbackEPx) {
    userProcessor = userProc;
    ConfigDataObj = ConfigData;
    langIndex = 0;
    callbackEP = callbackEPx;
    DBAccess = dBAccess;
    LangLoop();
}
var addslashes = function (str) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}
var LangLoop = function () {
    if (ConfigDataObj.languages.length > langIndex) {
        finbase = ConfigDataObj.filepath + ConfigDataObj.filename;
        fin = finbase + ConfigDataObj.languages[langIndex] + ".csv";
        liner = new lineByLine(fin);
        var dbstring = ConfigDataObj.languages[langIndex].toLowerCase() + "wiki_p";
        console.log("===========================================");
        console.log("Connecting to database " + dbstring + " and requesting for packages...");
        if (langIndex > 0) {
            wikiCaller.end();
            packnum = 0;
        }
        var clientopts =
            {
                host: DBAccess.host,
                user: DBAccess.user,
                password: DBAccess.password,
                port: DBAccess.port,
                db: dbstring
            };
        wikiCaller = new Client(clientopts);
        LangExecute();
    }
    else {
        callbackEP();
        wikiCaller.end();
    }

}
var LCallback = function () {
    langIndex += 1;
    LangLoop();
}
var LangExecute = function () {
    TraductionLoop();
}
var TraductionLoop = function () {
    var line;
    if (line = liner.next())
        TraductionExecute(line)
    else {
        LCallback();
    }

}
var TraductionExecute = function (line) {
    var RQ = "";
    var i = 0;
    var flag=true;
    do {
        if (i != 0&&flag)
            RQ += ",";
        else
            flag=true;
        let lineascii = line.toString('utf8');
        lineascii = lineascii.substring(0, lineascii.length).replace('\r',"");
        try
        {
        RQ += ("\"" + addslashes(decodeURI(lineascii.split("wiki/")[1])) + "\"");
        }
        catch(err)
        {
            flag=false;
        }
        i++;
    } while (i < traductionLines && (line = liner.next()));
    var queryX = MountQuery1(RQ);
    wikiCaller.query(queryX,
        function (err, rows) {
            if (err)
                throw err;
            UserTranslateExecution(rows);
        }
    );
}
var UserTranslateExecution = function (rows) {
    var RQ = rows[0].page_id;
    for (var i = 1; i < rows.length; i++)
        RQ += (", " + rows[i].page_id);
    queryX = MountQuery2(RQ);
    wikiCaller.query(queryX,
        function (err, rows) {
            if (err)
                throw err;
            InsertUsersInProcessor(rows);
        }
    );
}
var InsertUsersInProcessor = function (rows) {
    var UD;
    var elen = 0;
    for (var i = 1; i < rows.length; i++) {
        key = rows[i].rev_user_text;
        if ((UD = userProcessor.get(key)) == null) {
            UD = new Object();
            UD.edits = 0;
            UD.maxEdit = 0;
            UD.name = utf8.decode(rows[i].rev_user_text);
        }
        UD.edits += 1;
        elen = rows[i].rev_len - rows[i].old_len;
        if (UD.maxEdit < elen)
            UD.maxEdit = elen;
        if(elen>ConfigDataObj.minEditSize&&(UD.newestEdit==null||UD.newestEdit<rows[i].rev_timestamp))
            UD.newestEdit=rows[i].rev_timestamp;
        userProcessor.set(key, UD);
    }
    packnum++;
    console.log("Packs completed: " + packnum);
    TraductionLoop();
}
var Query = function (RQ, callbackTE) {
    console.log(RQ);
    callbackTE();
}
var MountQuery1 = function (RQ) {
    return `select page_id from page where page_title in (${RQ}) and page_namespace=0;`;
}
var MountQuery2 = function (RQ) {
    return `select t0.rev_user, t0.rev_user_text, t0.rev_len,t0.rev_timestamp, ifnull(t1.rev_len,0) 
    as old_len from revision t0, revision t1 
    where t0.rev_page in(${RQ}) and t0.rev_parent_id=t1.rev_id and t0.rev_user!=0 and t0.rev_minor_edit!=1 and t0.rev_timestamp>='${ConfigDataObj.oldestAcceptedEdit}';`;
}
//ENTRY POINT
console.log("Loading Settings...")
var userProcessor = new HashMap();
fs.readFile('config.json', function (err, logData) {
    if (err) throw err;
    var text = logData.toString();
    ConfigDataObj = JSON.parse(text);
    ConfigDataObj.output="2/users";
    if(ConfigDataObj.continueFromModule=="B")
        ConfigDataObj.filename="1B/";
    else if(ConfigDataObj.continueFromModule=="A")
        ConfigDataObj.filename="1A/";
    else
        ConfigDataObj.filename="1C/";
    if (!fs.existsSync(ConfigDataObj.filepath+"2/")) {
        fs.mkdirSync(ConfigDataObj.filepath+"2/");
        }
    fs.readFile(ConfigDataObj.databaseconfig, function (err, logData) {
        if (err) throw err;
        var text = logData.toString();
        dbAccess = JSON.parse(text);
        console.log("Completed!");
        extract(userProcessor, dbAccess, ConfigDataObj, function () {
            console.log("Process fully completed!");
            users = userProcessor.values();
            users.sort(function (a, b) { return -a.edits + b.edits });
            filteredUsers = [];
            var FUindex = 0;
            var Uindex = 0;
            Fstream = fs.createWriteStream(ConfigDataObj.filepath + ConfigDataObj.output + ".csv", { 'flags': 'w' });
            Fstream.write("Username,NumberOfEditsOnInput,MaxEditOnIput,LastActivityOnInput\n");
            for (Uindex = 0; Uindex < users.length; Uindex++) {
                DU = users[Uindex];
                if (DU.edits > ConfigDataObj.minEditNumber && DU.maxEdit > ConfigDataObj.minEditSize && !DU.name.toLowerCase().includes("bot") &&DU.newestEdit>=ConfigDataObj.latestActivity) {                    
                    filteredUsers[FUindex] = DU;
                    Fstream.write(DU.name + "," + DU.edits + "," + DU.maxEdit + ","+DU.newestEdit+"\n");
                    FUindex++;
                }
            }
            Fstream.end("");
            return;
        });
    });
});