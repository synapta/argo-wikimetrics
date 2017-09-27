//flow:
//caricare nella hashset gli url bianchi della lingua di interesse OK
//caricare nella hashset gli url neri della lingua di interesse OK
//leggere N utenti mischiandoli OK
//1-aprire connessione con lingua
//2-preparare pacchetto o torna a 1
//3-eseguire query e torna a 2

//interrogare database e gettare tutte edit dell'utente. Calcolare punteggi per quella lingua e buttarlo nella hashmap
//passare a lingua successiva
//estrarre utenti e salvare

var configData;
var dbAccess;
var userProcessor;
var epCallback;
var usersToAnalyze;
var whitePages;
var blackPages;
var utf8;
var USER_PER_QUERY=10;
var languageIndex;
var userIndex;
var dbCaller;
var Client;
exports.init=function(ConfigData,DbAccess,UserProcessor,EPcallback)
{
    configData=ConfigData;
    dbAccess=DbAccess;
    userProcessor=UserProcessor;
    epCallback=EPcallback;
    usersToAnalyze=[];
    utf8 = require('utf8');
    lineByLine = require('n-readlines');
    HashSet=require('hashset');
    languageIndex=0;
    userIndex=0;
    Client = require('mariasql');
    whitePages=new HashSet();
    blackPages=new HashSet();//al massimo è vuoto
    //load white pages
    for(var i=0;i<ConfigData.whitePages.length;i++)
    {
        var liner = new lineByLine(ConfigData.filepath+ConfigData.whitePages[i].value);
        var line;
        while((line=liner.next()))
        {
            whitePages.add("\""+addslashes(decodeURI(line.toString('ascii').split("wiki/")[1]))+"\"");
        }
    }
    //load black pages
    for(var i=0;i<ConfigData.whitePages.length;i++)
    {
        var liner = new lineByLine(ConfigData.filepath+ConfigData.blackPages[i].value);
        var line;
        while((line=liner.next()))
        {
            blackPages.add("\""+addslashes(decodeURI(line.toString('ascii').split("wiki/")[1]))+"\"");
        }
    }
    //load users to inspect(
    var liner = new lineByLine(ConfigData.filepath+ConfigData.usersFilename);
    var line;
    var i=0;
    while((line=liner.next()))
    {
        usersToAnalyze[i]=(line.toString('utf8').split(",")[0]);
        i++;
    }
    console.log(usersToAnalyze);
    usersToAnalyze=shuffleArray(usersToAnalyze);
    console.log(usersToAnalyze);
    openLanguage();
    
}
var openLanguage=function()
{
    if(languageIndex>0)
        console.log("chiudendo...")//dbCaller.end();
    if(languageIndex==configData.languages.length)
    {
        console.log("end end");
        return;
    } 
    languageIndex++;
    userIndex=0;
    preparePack();
    languageIndex++;   
    
}
var preparePack=function()
{
    var RQ="";
    var base=userIndex;
    while(userIndex<usersToAnalyze.length&&(userIndex-base)<USER_PER_QUERY)
    {
        RQ+=(usersToAnalyze[userIndex]+" ");
        userIndex++;
    }
    if(userIndex==base)
    {
        openLanguage();
        return;
    }
    sendPack(RQ);
}
var sendPack=function(RQ)
{
    console.log(RQ);
    preparePack();
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