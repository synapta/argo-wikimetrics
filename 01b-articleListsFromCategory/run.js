//INCLUDES
var fs = require('fs');
var request=require('request');
//GLOBALS
var configDataObj;
var dbAccess;
var Categories;
var wikiIndex=-1;
var hop;
var Pages;
var PagesIndex;
var PresentLevel;
var NextLevel;
var PresentIndex;
var NextIndex=0;
var CONST_ITEMS_PER_QUERY=50;
//FUNCTIONS
var MountTraductionQuery=function(entity,langs)
{
    var langstring="";
    for(var i=0;i<langs.length;i++)
    {
        if(i>0)
            langstring+="|";
        langstring+=("(https://"+langs[i].toLowerCase()+".wikipedia)");
    }
    return `select ?wp where 
    {
    ?wp schema:about <http://www.wikidata.org/entity/${entity}> FILTER (regex(STR(?wp), "${langstring}"))
    }`;
}
var TraductionStep=function()
{
    console.log("Traducing category to local names via SPARQL query to Wikidata...");
    var sparqlQuery=MountTraductionQuery(configDataObj.category,configDataObj.languages);
    var query = "https://query.wikidata.org/sparql?query=" + encodeURI(sparqlQuery);
    var options = {
        url: query,
        headers: {
            'Accept': "text/csv"
        }
    }
    
    request(options, function(error, response, body) {
        if (response.statusCode != 200) {
            console.log("Query failed: " + response.statusCode);
            return -1;
        }
        ExtractCategoryNames(body);
    });
   
}
var ExtractCategoryNames=function(body)
{
    var lines=body.split('\n');
    Categories=[];
    var outString="";
    for(var i=1;i<lines.length&&lines[i].length>3;i++)//first line contains headers, may contain dirty \n at the end
    {
        Categories[i-1]=new Object();
        Categories[i-1].value=lines[i].split(':')[2].replace('\r','');
        Categories[i-1].wiki=lines[i].split('//')[1].split(".")[0];
        outString+=(Categories[i-1].value+"("+Categories[i-1].wiki+") ");
    }
    console.log("Completed!\nCorresponding names are: "+outString);
    
    WikiOpen();
}
var WikiOpen=function()
{
    wikiIndex++;
    hop=0;
    Pages=[];
    NextLevel=[];
    NextLevel[0]=Categories[wikiIndex].value;
    if(wikiIndex==Categories.length)
    {
        console.log("\n\nProcess fully completed!")
        return 0;
    }
    console.log("===========================================");
    console.log("Opening wiki "+Categories[wikiIndex].wiki.toUpperCase());
    doHop();
}
var doHop=function()
{
    hop++;
    if(hop==configDataObj.maxLevel)
    {
        GetPages(0);
        return;
    }
    console.log("Hop "+hop);
    PresentLevel=NextLevel;
    NextLevel=[];
    PresentIndex=0;
    NextIndex=0;

}
var GetLevelChilds=function()
{
    if(PresentIndex>=PresentLevel.length)
    {
        doHop();
        return;
    }
    console.log("At "+PresentIndex+" of "+PresentLevel.length);
    var query=BuildCategoryQuery(PresentLevel,PresentIndex,PresentIndex+CONST_ITEMS_PER_QUERY);
    PresentIndex+=CONST_ITEMS_PER_QUERY;
    //query
    //call yourself, then nexthop
}
var GetPages=function(startindex)
{
    //call yourself, then OpenWiki
}
var BuildCategoryQuery=function(arr,start,end)
{
    var j=start;
    var RQ="";
    while(j<end&&j<arr.length)
    {
        if(j>1)
            RQ+=',';
        RQ+="'"+arr[j]+"'";
        j++;
    }
    return `select page_namespace,page_title from categorylinks t0, page t1 where page_id=cl_from and cl_to in (${RQ})`;
}


//ENTRY POINT
console.log("Loading settings...");
fs.readFile('config.json', function (err, logData) {
    if (err) throw err;

    var text = logData.toString();
    configDataObj = JSON.parse(text);
    fs.readFile(configDataObj.databaseconfig, function (err, logData) {
        if (err) throw err;
    
        var text = logData.toString();
        dbAccess = JSON.parse(text);
        console.log("Completed!");
        console.log("===========================================");
        TraductionStep();
    });
    //TODO
});
