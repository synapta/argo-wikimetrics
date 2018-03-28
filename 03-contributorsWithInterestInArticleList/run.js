//INCLUDES
var lineByLine = require('n-readlines');
var HashSet=require('hashset');
var Client = require('mariasql');
var HashMap=require('hashmap');
var utf8 = require('utf8');
var fs=require('fs');
var CSVstringify = require('csv-stringify');
//CONSTANTS
const USER_PER_QUERY=1;
//GLOBALS
var configData;
var dbAccess;
var userProcessor;
var epCallback;
var usersToAnalyze;
var whitePages;
var blackPages;
var languageIndex;
var userIndex;
var dbCaller;
var packnum;
var totpacks;
//FUNCTIONS
init=function(EPcallback) {
    console.log("Loading users and pages of interest....");
    epCallback=EPcallback;
    usersToAnalyze=[];
    languageIndex=0;
    userIndex=0;
    whitePages=new HashSet();
    blackPages=new HashSet();

    //load white pages
    for (var i=0; i<configData.whitePages.length; i++) {
        var liner = new lineByLine(configData.filepath+configData.whitePages[i]);
        var line;
        while((line=liner.next())) {
            try
            {
            toAdd=addslashes(decodeURI(line.toString('utf8').split("wiki/")[1])).replace(/\r?\n|\r/,"");
            whitePages.add(toAdd);
            }
            catch(err)
            {}
        }
    }

    //load black pages
    for (var i=0; i<configData.blackPages.length; i++) {
        var liner = new lineByLine(configData.filepath+configData.blackPages[i]);
        var line;
        while((line=liner.next())) {
            try
            {
            toAdd=addslashes(decodeURI(line.toString('utf8').split("wiki/")[1])).replace(/\r?\n|\r/,"");
            blackPages.add(toAdd);
            }
            catch(err)
            {}
        }
    }

    //load users to inspect
    var liner = new lineByLine(configData.filepath+configData.usersFilename);
    var line;
    var i=0;
    liner.next();//skip header
    while((line=liner.next())) {
        usersToAnalyze[i]=(line.toString('utf8').split(",")[0]);
        i++;
    }
    usersToAnalyze = shuffleArray(usersToAnalyze);

    totpacks=Math.ceil(usersToAnalyze.length/USER_PER_QUERY)*2;
    console.log("Completed!");
    openLanguage();
}

var openLanguage = function() {
    if (languageIndex>0) {
        console.log("Chiudo.");
        dbCaller.end();
    }

    if(languageIndex==configData.languages.length) {
        console.log("\nProcess completed");
        epCallback();
        return;
    }

    var dbstring = configData.languages[languageIndex].toLowerCase()+"wiki_p";
    console.log("===========================================");
    console.log("Connecting to database "+dbstring+" ("+(languageIndex+1)+" of "+configData.languages.length+") and requesting for packages...");
    var clientopts = {
        host: dbAccess.host,
        user: dbAccess.user,
        password: dbAccess.password,
        port: dbAccess.port,
        db: dbstring
    };
    dbCaller=new Client(clientopts);
    languageIndex++;
    userIndex=0;
    packnum=1;
    preparePack();
}

var preparePack = function() {
    var RQ="";
    var base=userIndex;
    var inEvaluation=[];

    while(userIndex<usersToAnalyze.length&&(userIndex-base)<USER_PER_QUERY) {
        if((userIndex-base)>0)
            RQ+=",";
        inEvaluation[userIndex-base]=usersToAnalyze[userIndex];
        RQ+=("'"+usersToAnalyze[userIndex].replace(/'/g,"''")+"'");//single quotes escaped in sql fashion
        userIndex++;
    }

    if(userIndex==base) {
        openLanguage();
        return;
    }
    sendPack(RQ, inEvaluation);
}

var sendPack=function(RQ,inEvaluation) {
    queryX=queryCompose(RQ);
    console.log("Requesting pack "+packnum+" of "+totpacks+"...");
    packnum++;
    dbCaller.query(queryX,
        function(err, rows)
        {
            if (err)
                throw err;
            //!console.log(rows);
            console.log("Elaborating");
            openRows(rows,null);
            queryY=queryCompose2(RQ);
            console.log("Requesting pack "+packnum+" of "+totpacks+"...");
            packnum++;
            dbCaller.query(queryY,
                function(err, rows)
                {
                    if (err)
                        throw err;
                    console.log("Elaborating");
                    openRows(rows,inEvaluation);

                }
            );
        }
    );
}

var openRows=function(rows,inEvaluation) {
    for(var i=0;i<rows.length;i++) {
        key=utf8.decode(rows[i].rev_user_text);

        if((UD=userProcessor.get(key))==null) {
            UD=new Object();
            UD.user=utf8.decode(rows[i].rev_user_text).replace(/^'/,"").replace(/'$/,"");

            UD.allEdits=0;
            UD.whiteEdits=0;
            UD.blackEdits=0;

            UD.blackReverted=0;
            UD.whiteReverted=0;
            UD.allReverted=0;

            UD.totalCreatedPages=0;
            UD.whiteDistinctPagesCreated=0;
            UD.whiteDistinctPagesEdited=0;
            UD.whiteEditsMediumLengthPerPage=0;

            UD.numberOfLanguages=0;

            UD.articles=null;
        }

        if(UD.articles==null) {
            UD.articles=new HashMap();
        }

        UD=givePoints(UD,rows[i]);
        userProcessor.set(key,UD);
    }

    if(inEvaluation!=null) {
        collapse(inEvaluation);
        preparePack();
    }
}

var collapse=function(inEvaluation) {
    var i=0;
    console.log("Collapsing");
    while(i<inEvaluation.length) {
        key=inEvaluation[i];
        UD=userProcessor.get(key);

        var k=0;
        var sum=0;
        if(UD==null)
        {
            i++;
            continue;
        }
        var HT=UD.articles;
        if(HT==null)
        {
            i++;
            continue;
        }
        var tab=HT.values();
        var prec=0;
        while(k<tab.length)
        {
            sum+=tab[k].sum;
            k++;
        }
        if(k>0)
        {
            prec=UD.whiteEditsMediumLengthPerPage*UD.whiteDistinctPagesEdited;

            UD.whiteEditsMediumLengthPerPage=(prec+sum)/(UD.whiteDistinctPagesEdited+k);
            UD.numberOfLanguages++;
            UD.whiteDistinctPagesEdited+=k;
        }
        UD.articles.clear();
        UD.articles=null;
        i++;
    }
}

var givePoints = function (UD, row) {
    var currentPageKey = addslashes(utf8.decode(row.page_title));
    //possibileRevert?
    if(row.rev_len == row.old_len2) {
        if(whitePages.contains(currentPageKey))
        {
            UD.whiteReverted++;
        }
        else if(blackPages.contains(currentPageKey))
            UD.blackReverted++;
        UD.allReverted++;
    } //is new?
    else if (row.old_len == -1) {
        UD.totalCreatedPages++;
        if (whitePages.contains(currentPageKey)) {
            UD.whiteDistinctPagesCreated++;
            if(UD.lastWhiteEdit==null||row.rev_timestamp>UD.lastWhiteEdit)
                UD.lastWhiteEdit=row.rev_timestamp;
        }
    } //is simple edit
    else {
        if (whitePages.contains(currentPageKey)) {
            UD.whiteEdits++;
            var uKey=currentPageKey+configData.languages[languageIndex];
            var Stats = UD.articles.get(uKey);
            if (Stats==null) {
                Stats=new Object();
                Stats.sum=0;
                Stats.edit=0;
            }
            var len=(row.rev_len-row.old_len);
            if(len>0) {
                Stats.sum+=len;
                Stats.edit++;
            }
            if(UD.lastWhiteEdit==null||row.rev_timestamp>UD.lastWhiteEdit)
                UD.lastWhiteEdit=row.rev_timestamp;
            UD.articles.set(uKey,Stats);
        }
        else if(blackPages.contains(currentPageKey)) {
            UD.blackEdits++;
        }
    }
    UD.allEdits++;
   
    return UD;
}

var queryCompose = function (RQ) {
    return `select t3.page_title, t0.rev_len,t0.rev_user_text,t0.rev_timestamp, ifnull(t1.rev_len,0) as old_len, ifnull(t2.rev_len,0) as old_len2
    from revision_userindex t0, revision t1, revision t2, page t3
	where t0.rev_page=t3.page_id
    and t0.rev_parent_id=t1.rev_id
    and t1.rev_parent_id=t2.rev_id
    and t3.page_namespace=0
    and t0.rev_minor_edit!=1
    and t0.rev_user in (select user_id from user where user_name in (${RQ}))`;
}

var queryCompose2 = function (RQ) {
    return `select t3.page_title, t0.rev_len,t0.rev_user_text,t0.rev_timestamp, ifnull(t1.rev_len,0) as old_len, 0 as old_len2
    from revision_userindex t0, revision t1, page t3
	where t0.rev_page=t3.page_id
    and t0.rev_parent_id=t1.rev_id
    and t1.rev_parent_id=0
    and t3.page_namespace=0
    and t0.rev_minor_edit!=1
    and t0.rev_user in (select user_id from user where user_name in (${RQ}))
    union
    select t3.page_title, t0.rev_len,t0.rev_user_text,t0.rev_timestamp, -1 as old_len, 0 as old_len2
    from revision_userindex t0, page t3
	where t0.rev_page=t3.page_id
    and t0.rev_parent_id=0
    and t3.page_namespace=0
    and t0.rev_user in (select user_id from user where user_name in (${RQ}))`;
}

var addslashes=function(str) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

var shuffleArray=function(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

//ENTRY POINT
console.log("Loading configuration....");
var userProcessor=new HashMap();
fs.readFile('config.json', function (err, logData) {
    if (err) throw err;
    var text = logData.toString();
    configData=JSON.parse(text);
    configData.usersFilename="2/users.csv";
    configData.whitePages=[];
    if (!fs.existsSync(configData.filepath+"3/")) 
    {
        fs.mkdirSync(configData.filepath+"3/");
    }
    for(var kxy=0;kxy<configData.languages.length;kxy++)
        configData.whitePages[kxy]="1C/"+configData.languages[kxy]+".csv";
    fs.readFile(configData.databaseconfig, function (err, logData) {
        if (err) throw err;
        var text = logData.toString();
        dbAccess=JSON.parse(text);
        console.log("Completed!");
        init(function() {
            var columns=['user','allEdits','whiteEdits','blackEdits','blackReverted','whiteReverted','allReverted','totalCreatedPages','whiteDistinctPagesCreated','whiteDistinctPagesEdited','whiteEditsMediumLengthPerPage','numberOfLanguages','lastWhiteEdit'];
            results=userProcessor.values();
            CSVstringify(results, {header:true,columns:columns}, function(err, output) {
                fs.appendFileSync(configData.filepath + '3/users.csv', output);
            });
        });
    });
});
