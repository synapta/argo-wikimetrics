const traductionLines=200;
var userProcessor;
var wikiCaller=null;
var ConfigDataObj;
var lineByLine;
var langIndex;
var liner;
var callbackEP;
var DBAccess;
var Client;
var packnum=0;
var utf8;
exports.extract=function(userProc,dBAccess,ConfigData,callbackEPx)
{
    //STEP 1: open 1 language
    //STEP 2: read line and request traduction
    //STEP 3: request info from codes
    //STEP 4: save results
    Client = require('mariasql');
    lineByLine = require('n-readlines');
    userProcessor=userProc;
    utf8 = require('utf8');
    ConfigDataObj=ConfigData;
    langIndex=0;
    callbackEP=callbackEPx;
    DBAccess=dBAccess;
    LangLoop();
}
var addslashes=function(str)
{
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}
var LangLoop=function()
{    
    if(ConfigDataObj.languages.length>langIndex)
    {
        finbase=ConfigDataObj.filepath+ConfigDataObj.filename;
        fin=finbase+(ConfigDataObj.languages[langIndex].value+".csv");
        liner = new lineByLine(fin);
        console.log(fin);
        var dbstring=ConfigDataObj.languages[langIndex].value.toLowerCase()+"wiki_p";
        console.log("Connecting to DBstring..."+dbstring);
        if(langIndex>0)
        {
            wikiCaller.end();
            packnum=0;//KEEP THIS
            /*if(langIndex>0)//FLAAAAAAAAAAAAAAAAAAAAG
            {
                callbackEP();
                return;
            }*/
        }    
        var clientopts=
        {
            host: DBAccess.host,
            user: DBAccess.user,
            password:  DBAccess.password,
            port: DBAccess.port,
            db: dbstring
        };
        //console.log(clientopts);
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
        RQ+=("\""+addslashes(decodeURI(lineascii.split("wiki/")[1]))+"\"");
        i++;
    } while(i<traductionLines&&(line=liner.next()));
    var query1="select page_id from page where page_title in (";
    var query2=") and page_namespace=0";
    var queryX=query1+RQ+query2;
    //!console.log(queryX);
    wikiCaller.query(queryX, 
        function(err, rows) 
        {
            if (err)
                throw err;
            //!console.log(rows);
            UserTranslateExecution(rows);
            
        }
    );
}
var UserTranslateExecution=function(rows)
{
    //monta la query numero due
    query1="select t0.rev_user, t0.rev_user_text, t0.rev_len, ifnull(t1.rev_len,0) as old_len from revision t0, revision t1 where t0.rev_page in(";
    query2=") and t0.rev_parent_id=t1.rev_id and t0.rev_user!=0 and t0.rev_minor_edit!=1;";
    var RQ=rows[0].page_id;
    for(var i=1;i<rows.length;i++)
        RQ+=(", "+rows[i].page_id);
    queryX=query1+RQ+query2;
    //eseguila
    //!console.log(queryX);
    wikiCaller.query(queryX, 
    function(err, rows) 
    {
        if (err)
            throw err;
        InsertUsersInProcessor(rows);
    }
);
}
var InsertUsersInProcessor=function(rows)
{
    var UD;
    var elen=0;
    for(var i=1;i<rows.length;i++)
    {
        key=rows[i].rev_user_text;
        if((UD=userProcessor.get(key))==null)
        {
            UD=new Object();
            UD.edits=0;
            UD.maxEdit=0;
            UD.name=utf8.decode(rows[i].rev_user_text);
        }
        /*else
            UD=userProcessor.get(key);*/
        UD.edits+=1;
        elen=rows[i].rev_len-rows[i].old_len;
        if(UD.maxEdit<elen)
            UD.maxEdit=elen;
        userProcessor.set(key,UD);
    }
    packnum++;    
    console.log("Packs completed: "+packnum);
    //calcola punteggi e inserisci utenti nella HT
    TraductionLoop();

}
var Query=function(RQ,callbackTE)
{
    console.log(RQ);
    callbackTE();
}