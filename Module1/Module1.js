exports.load = function (ConfigObject) 
{
    console.log("Requesting list of items...");
    var request = require('request');
    var fs = require('fs');
    var APIandQuery="https://query.wikidata.org/sparql?query="+encodeURI(ConfigObject.query).replace(/%22/g,"\""); //cambiato da "%22" a /%22/g!
    var request = require('request');
    var options=
    {
        url:APIandQuery,
        headers:
        {
            'Accept':"text/csv"
        }
    }
    request(options, function (error, response, body) 
    {
        if(response.statusCode!=200)
        {
            return -1; 
        }
        fs.writeFile(ConfigObject.filename+"_step1.csv", body, function(err) 
        {
            if(err) 
            {
                return -1;
            }
            //free some memory
            body=null;
            console.log("Step 1 file saved\nLoading single multilanguage items:");
            loadAll(ConfigObject);
        }); 
    });
}

var loadAll = function (ConfigObject) 
{
    var fs = require('fs');
    var properties=
    {
        CONST_LINEGROUP:10000,
        CONST_QUERY_P1:encodeURI("SELECT ?wp WHERE { VALUES ?entity {"),
        CONST_QUERY_P2:encodeURI("} ?wp schema:about ?entity FILTER (regex(STR(?wp), \"LANGS\" ))}"),
      
        CONST_LANG_P1:"(https://",
        CONST_LANG_P2:".wikipedia)", //usare | tra campi
    }
    FOUT=ConfigObject.filename+"_step2_";
    CONST_QUERY_P2=properties.CONST_QUERY_P2.replace(/%22/g,"\""),
    langs=ConfigObject.languages;
    //open streams
    var streams=new Object();
    streams["langs"]=langs;
    for(var i=0;i<langs.length;i++)
    {
        streams[langs[i].value.toLowerCase()]=fs.createWriteStream(FOUT+langs[i].value+".csv", {'flags': 'w'});
    }    

    var LANGSTRING="";
    for(var i=0;i<langs.length;i++)
    {
        LANGSTRING+=(properties.CONST_LANG_P1+langs[i].value.toLowerCase()+properties.CONST_LANG_P2);
        if(i!=(langs.length-1))
        {
            LANGSTRING+="|";
        }
    }
    properties.CONST_QUERY_P2=properties.CONST_QUERY_P2.replace("LANGS",LANGSTRING);
 
    fin=ConfigObject.filename+"_step1.csv";
  
    
    var lineByLine = require('n-readlines');
    var liner = new lineByLine(fin);
    line=liner.next();//drop first line, contains headers
    //console.log("Point 1");
    RecursiveAsker(liner,0,properties,streams);
   
}
var RecursiveAsker=function(liner,packnum,properties,streams)
{
    var line;
    var lineNumber = 0;
    var RQ="";
    console.log("Loading pack "+(packnum+1)+"...");
    //if(packnum==2)
       // return;
    while ((line = liner.next())&&lineNumber<properties.CONST_LINEGROUP) 
    {  
        RQ+=("%3C"+line.toString('ascii').split(",")[0]+"%3E%20");
        lineNumber++;        
    }
    QUERY=properties.CONST_QUERY_P1+RQ+properties.CONST_QUERY_P2;
    if(RQ!="")
    {
        executeRequest(QUERY, streams, function ()
        {
            if(lineNumber==properties.CONST_LINEGROUP)
            {
                RecursiveAsker(liner,packnum+1,properties,streams);
            }
            else
            {
                //close streams
                var langs=streams["langs"];
                for(var i=0;i<langs.length;i++)
                    streams[langs[i].value.toLowerCase()].end("");
                console.log("Step 2 file saved");
            }
        });
    }
    else
    {
        //close streams
        var langs=streams["langs"];
        for(var i=0;i<langs.length;i++)
            streams[langs[i].value.toLowerCase()].end("");
        console.log("Step 2 file saved");
    }
}
var executeRequest=function(QUERY, streams, callback)
{
    //console.log("Point 3 ");
    var request = require('request');
    var fs = require('fs');
    var APIandQuery="https://query.wikidata.org/sparql";//?query="+QUERY;
    var request = require('request');
    var options=
    {
        url:APIandQuery,
        headers:
        {
            'Accept':"text/csv",
            'Content-Type':"application/x-www-form-urlencoded"
        },
        body:"query="+QUERY
    }
    //console.log(APIandQuery);
    request.post(options, function (error, response, body) 
    {
        if(response.statusCode!=200)
        {
            console.log(response.statusCode);
            return -1; 
        }
        lines=body.split("\n");
        var i=1;//drop header
        //console.log(body);
        //console.log("Point 4");
        while(i<lines.length)
        {
            if(lines[i].length>4)
            {
                //console.log(lines[i]);
                langcode=lines[i].split("//")[1].split(".")[0];
                //console.log(langcode);
                //fs.appendFileSync(fname+langcode+".csv", lines[i]+"\n");
               
                streams[langcode].write(lines[i]+"\n");
            }
            i++;
        }
        //console.log("Point 5");
        callback();
    });
    //console.log(APIandQuery);
}
exports.loadAll=loadAll;