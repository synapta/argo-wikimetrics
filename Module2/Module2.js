const traductionLines=50;
var userProcessor;
var wikiCaller=null;
var ConfigDataObj;
var lineByLine;
var langIndex;
var liner;
var callbackEP;
var DBAccess;
var Client;
exports.extract=function(userProc,dBAccess,ConfigData,callbackEPx)
{
    //STEP 1: open 1 language
    //STEP 2: read line and request traduction
    //STEP 3: request info from codes
    //STEP 4: save results
    Client = require('mariasql');
    lineByLine = require('n-readlines');
    userProcessor=userProc;
 
    ConfigDataObj=ConfigData;
    langIndex=0;
    callbackEP=callbackEPx;
    DBAccess=dBAccess;
    LangLoop();
}
var LangLoop=function()
{    
    if(ConfigDataObj.languages.length>langIndex)
    {
        finbase=ConfigDataObj.filepath+ConfigDataObj.filename+"_step2_";
        fin=finbase+(ConfigDataObj.languages[langIndex].value+".csv");
        liner = new lineByLine(fin);
        console.log(fin);
        var dbstring=ConfigDataObj.languages[langIndex].value.toLowerCase()+"wiki_p";
        console.log("Connecting to DBstring..."+dbstring);
        if(langIndex>0)
            wikiCaller.end();
        var clientopts=
        {
            host: DBAccess.host,
            user: DBAccess.user,
            password:  DBAccess.password,
            port: DBAccess.port,
            db: dbstring
        };
        console.log(clientopts);
        wikiCaller=new Client(clientopts);
        console.log("Connected(?!)");
        LangExecute();
    }
    else
    {
        callbackEP();
        wikiCaller.end();
    }
      
}
var LCallback=function()
{
    langIndex+=1;
    LangLoop();
}
var LangExecute=function()
{
    TraductionLoop();
}
var TraductionLoop=function()
{
    var line;
    if(line=liner.next())
        TraductionExecute(line)
    else
    {
        LCallback();
    }   

}
var TraductionExecute=function(line)
{
    var RQ="";
    var i=0;
    do
    {
        if(i!=0)
            RQ+=",";
        let lineascii=line.toString('ascii');
        lineascii=lineascii.substring(0,lineascii.length-1)
        RQ+=("\""+decodeURI(lineascii.split("wiki/")[1]+"\""));
        i++;
    } while(i<traductionLines&&(line=liner.next()));
    var query1="select page_id from page where page_title in (\"Ginevra\") and page_namespace=0";
    wikiCaller.query(query1, 
        function(err, rows) 
        {
            if (err)
                throw err;
            console.log(rows);
            wikiCaller.end();
            //UserTranslateExecution(rows);
            throw new Error();
        }
    );
    /*Query(RQ,
        function()
        {
            TraductionLoop();
        }
    )*/
}
var UserTranslateExecution=function(rows)
{
    //monta la query numero due
    var query2="";
    //eseguila
    wikiCaller.query(query2, 
    function(err, rows) 
    {
        if (err)
            throw err;
        console.log(rows);
        InsertUsersInProcessor(rows);
    }
);
}
var InsertUsersInProcessor=function(rows)
{
    //calcola punteggi e inserisci utenti nella HT
    TraductionLoop();
}
var Query=function(RQ,callbackTE)
{
    console.log(RQ);
    callbackTE();
}