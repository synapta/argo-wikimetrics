const traductionLines=50;
var userProcessor;
var wikiCaller;
var ConfigDataObj;
var lineByLine;
var langIndex;
var liner;
exports.extract=function(userProc,wikiCall,ConfigData,callbackEP)
{
    //STEP 1: open 1 language
    //STEP 2: read line and request traduction
    //STEP 3: request info from codes
    //STEP 4: save results
    lineByLine = require('n-readlines');
    userProcessor=userProc;
    wikiCaller=wikiCall;
    ConfigDataObj=ConfigData;
    langIndex=0;
    LangLoop(callbackEP);
}
var LangLoop=function(callbackEP)
{    
    if(ConfigDataObj.languages.length>langIndex)
    {
        finbase=ConfigDataObj.filepath+ConfigDataObj.filename+"_step2_";
        fin=finbase+(ConfigDataObj.languages[langIndex].value+".csv");
        liner = new lineByLine(fin);
        console.log(fin);
        LangExecute(callbackEP);
    }
    else
        callbackEP();
}
var LangExecute=function(callbackEP)
{
    TraductionLoop(callbackEP,
        function(callbackEP)
        {
            langIndex+=1;
            LangLoop(callbackEP);
        }
    )
}
var TraductionLoop=function(callbackEP,LCallback)
{
    var line;
    if(line=liner.next())
        TraductionExecute(line,callbackEP,LCallback)
    else
    {
        LCallback(callbackEP);
    }   

}
var TraductionExecute=function(line,callbackEP,LCallback)
{
    var RQ="";
    var i=0;
    do
    {
        if(i!=0)
            RQ+=",";
        RQ+=("\""+decodeURI(line.toString('ascii')+"\""));
        i++;
    }while(i<traductionLines&&(line=liner.next()));
    Query(RQ,callbackEP,LCallback,
        function(callbackEP,LCallback)
        {
            TraductionLoop(callbackEP,LCallback);
        }
    )
}
var Query=function(RQ,callbackEP,LCallback,callbackTE)
{
    console.log(RQ);
    callbackTE(callbackEP,LCallback);
}