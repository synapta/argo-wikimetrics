//INCLUDES
var lineByLine = require('n-readlines');
var HashSet=require('hashset');
var Client = require('mariasql');
var HashMap=require('hashmap');
var utf8 = require('utf8');
var fs=require('fs');
//CONSTANTS
const USER_PER_QUERY=10;
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
init=function(EPcallback)
{
    epCallback=EPcallback;
    usersToAnalyze=[];
    languageIndex=0;
    userIndex=0;
    whitePages=new HashSet();
    blackPages=new HashSet();//al massimo è vuoto
    //load white pages
    for(var i=0;i<configData.whitePages.length;i++)
    {
        var liner = new lineByLine(configData.filepath+configData.whitePages[i].value);
        var line;
        while((line=liner.next()))
        {
            toAdd=addslashes(decodeURI(line.toString('ascii').split("wiki/")[1])).replace(/\r?\n|\r/,"");
            //console.log(toAdd);
            whitePages.add(toAdd);
        }
    }
    //load black pages
    for(var i=0;i<configData.blackPages.length;i++)
    {
        var liner = new lineByLine(configData.filepath+configData.blackPages[i].value);
        var line;
        while((line=liner.next()))
        {
            toAdd=addslashes(decodeURI(line.toString('ascii').split("wiki/")[1])).replace(/\r?\n|\r/,"");
            //console.log(toAdd);
            blackPages.add(toAdd);
        }
    }
    //load users to inspect(
    var liner = new lineByLine(configData.filepath+configData.usersFilename);
    var line;
    var i=0;
    while((line=liner.next()))
    {
        usersToAnalyze[i]=(line.toString('utf8').split(",")[0]);
        i++;
    }
    //console.log(usersToAnalyze);
    usersToAnalyze=shuffleArray(usersToAnalyze);
    //console.log(usersToAnalyze);
    totpacks=Math.ceil(usersToAnalyze.length/USER_PER_QUERY)*2;
    openLanguage();
    
}
var openLanguage=function()
{
    if(languageIndex>0)
    {
        console.log("Chiudo. ");
        dbCaller.end();
        console.log(userProcessor.values());
        //throw new Error();
        
    }    
    if(languageIndex==configData.languages.length)
    {
        console.log("\nProcess completed");
        epCallback();
        return;
    } 
    var dbstring=configData.languages[languageIndex].value.toLowerCase()+"wiki_p";
    console.log("===========================================");
    console.log("Connecting to database "+dbstring+" ("+(languageIndex+1)+" of "+configData.languages.length+") and requesting for packages...");
    var clientopts=
    {
        host: dbAccess.host,
        user: dbAccess.user,
        password: dbAccess.password,
        port: dbAccess.port,
        db: dbstring
    };
    //console.log(clientopts);
    dbCaller=new Client(clientopts);
    languageIndex++;
    userIndex=0;
    packnum=1;
    preparePack();
    
}
var preparePack=function()
{
    var RQ="";
    var base=userIndex;
    var inEvaluation=[];
    while(userIndex<usersToAnalyze.length&&(userIndex-base)<USER_PER_QUERY)
    {
        if((userIndex-base)>0)
            RQ+=",";
        inEvaluation[userIndex-base]=usersToAnalyze[userIndex];
        RQ+=("'"+usersToAnalyze[userIndex]+"'");
        userIndex++;
    }
    if(userIndex==base)
    {
        openLanguage();
        return;
    }
    sendPack(RQ,inEvaluation);
}
var sendPack=function(RQ,inEvaluation)
{
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
var openRows=function(rows,inEvaluation)
{
    for(var i=1;i<rows.length;i++)
    {
        key=utf8.decode(rows[i].rev_user_text);
        if((UD=userProcessor.get(key))==null)
        {
            UD=new Object();
            UD.news=0;
            UD.blackCancels=0;
            UD.whiteCancels=0;
            UD.allCancels=0;
            UD.whiteEdits=0;
            UD.blackEdits=0;
            UD.allEdits=0;
            UD.name=utf8.decode(rows[i].rev_user_text);
            UD.articles=null;
            UD.whiteEditsMediumLength=0;
            UD.collapsedLanguages=0;
            UD.whitePagesN=0;
        }
        if(UD.articles==null)
        {
            UD.articles=new HashMap();
        }
        UD=givePoints(UD,rows[i]);
        userProcessor.set(key,UD);
    }
    if(inEvaluation!=null)
    {
        collapse(inEvaluation);
        preparePack();
    }
}
var collapse=function(inEvaluation)
{
    var i=0;
    console.log("Collapsing");
    while(i<inEvaluation.length)
    {
        key=inEvaluation[i];
        UD=userProcessor.get(key);
        /*if(UD==null)
            console.log("NF");*/
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
            prec=UD.whiteEditsMediumLength*UD.whitePagesN;
            /*console.log("ML:"+UD.whiteEditsMediumLength);
            console.log("UP:"+UD.whitePagesN);
            console.log("P:"+prec);
            console.log("S:"+sum);
            console.log("W:"+UD.whitePagesN);
            console.log("K:"+k);*/
            UD.whiteEditsMediumLength=(prec+sum)/(UD.whitePagesN+k);
            UD.collapsedLanguages++;
            UD.whitePagesN+=k;
        }
        UD.articles.clear();
        UD.articles=null;
        i++;
    }
}
var givePoints=function(UD,row)
{
    key2=utf8.decode(row.page_title);
    //is Cancel?
    if(row.rev_len==row.old_len2)
    {
        if(whitePages.contains(key2))
            UD.whiteCancels++;
        else if(blackPages.contains(key2))
            UD.blackCancels++;
        UD.allCancels++;
    } //is new?
    else if(row.old_len==-1)
    {
        UD.news++;
    }//is edit
    else
    {
        if(whitePages.contains(key2))
        {
            UD.whiteEdits++;
            var Stats=UD.articles.get(key2);
            if(Stats==null)
            {
                Stats=new Object();
                Stats.sum=0;
                Stats.edit=0;
            }  
            var len=(row.rev_len-row.old_len);
            if(len>0)
            {
                Stats.sum+=len;            
                Stats.edit++;
            }
            UD.articles.set(key2,Stats);
            
        }
        else if(blackPages.contains(key2))
            UD.blackEdits++;
        UD.allEdits++;
    }
    return UD;
}
var queryCompose = function (RQ) 
{
    return `select t3.page_title, t0.rev_len,t0.rev_user_text, ifnull(t1.rev_len,0) as old_len, ifnull(t2.rev_len,0) as old_len2 
    from revision_userindex t0, revision t1, revision t2, page t3
	where t0.rev_page=t3.page_id
    and t0.rev_parent_id=t1.rev_id 
    and t1.rev_parent_id=t2.rev_id
    and t3.page_namespace=0
    and t0.rev_user in (select user_id from user where user_name in (${RQ}))`;
}
var queryCompose2 = function (RQ) 
{
    return `select t3.page_title, t0.rev_len,t0.rev_user_text, ifnull(t1.rev_len,0) as old_len, 0 as old_len2 
    from revision_userindex t0, revision t1, page t3
	where t0.rev_page=t3.page_id
    and t0.rev_parent_id=t1.rev_id 
    and t1.rev_parent_id=0
    and t3.page_namespace=0
    and t0.rev_user in (select user_id from user where user_name in (${RQ}))
    union
    select t3.page_title, t0.rev_len,t0.rev_user_text, -1 as old_len, 0 as old_len2 
    from revision_userindex t0, page t3
	where t0.rev_page=t3.page_id
    and t0.rev_parent_id=0
    and t3.page_namespace=0
    and t0.rev_user in (select user_id from user where user_name in (${RQ}))`;
}
var addslashes=function(str)
{
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
fs.readFile('config.json', function (err, logData) 
{
    if (err) throw err;
    var text = logData.toString();
    configData=JSON.parse(text);
    fs.readFile(configData.databaseconfig, function (err, logData) 
    {
        if (err) throw err;
        var text = logData.toString();
        dbAccess=JSON.parse(text);
        console.log("Completed!");
        init(function(){
            var p=0;
            results=userProcessor.values();
            Fstream = fs.createWriteStream(configData.filepath + configData.filename + "_USERS_OUT.json", { 'flags': 'w' });
            Fstream.write("[");
            while(p<results.length)
            {
                toWrite=JSON.stringify(results[p]);
                if(p>0)
                    toWrite=","+toWrite;
                Fstream.write(toWrite);
                p++;
            }
            Fstream.end("]");
        });
    });
});