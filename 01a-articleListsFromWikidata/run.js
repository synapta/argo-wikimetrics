var request = require('request');
var fs = require('fs');
var lineByLine = require('n-readlines');


var load = function (ConfigObject) {
    console.log("Requesting list of items via SPARQL query to Wikidata...");

    var sparqlQuery = fs.readFileSync(ConfigObject.query).toString();
    console.log(sparqlQuery);

    var query = "https://query.wikidata.org/sparql?query=" + encodeURI(sparqlQuery);
    var options = {
        url: query,
        headers: {
            'Accept': "text/csv"
        }
    }

    request(options, function (error, response, body) {
        if (response.statusCode != 200) {
            console.log("Query failed: " + response.statusCode);
            return -1;
        }

        if (!fs.existsSync(configDataObj.filepath)) {
            fs.mkdirSync(configDataObj.filepath);
        }
        fs.writeFile(configDataObj.filepath + "items.csv", body, function (err) {
            if (err) {
                console.log("File writing failed: " + err);
                return -1;
            }

            console.log("Completed!");
            console.log("===========================================");
            console.log("Expanding items by languages:");
            loadAll(ConfigObject);
        });
    });
}

var recursiveAsker = function (liner, packnum, properties, streams) {
    var line;
    var lineNumber = 0;
    var RQ = "";

    console.log("Loading pack " + (/*streams["langs"][packnum]*/packnum) + "...");

    while ((line = liner.next()) && lineNumber < properties.CONST_LINEGROUP) {
        RQ += ("%3C" + line.toString('ascii').split(",")[0] + "%3E%20");
        lineNumber++;
    }
    QUERY = properties.CONST_QUERY_P1 + RQ + properties.CONST_QUERY_P2;
    if (RQ != "") {
        executeRequest(QUERY, streams, function () {
            if (lineNumber == properties.CONST_LINEGROUP) {
                recursiveAsker(liner, packnum + 1, properties, streams);
            } else {
                //close streams
                var langs = streams["langs"];
                for (var i = 0; i < langs.length; i++) {
                    streams[langs[i].toLowerCase()].end("");
                }
                console.log("Completed!");
            }
        });
    } else {
        //close streams
        var langs = streams["langs"];
        for (var i = 0; i < langs.length; i++) {
            streams[langs[i].toLowerCase()].end("");
        }
        console.log("Completed!");
    }
}

var executeRequest = function (QUERY, streams, callback) {
    //console.log("Point 3 ");
    var APIandQuery = "https://query.wikidata.org/sparql"; //?query="+QUERY;
    var options = {
        url: APIandQuery,
        headers: {
            'Accept': "text/csv",
            'Content-Type': "application/x-www-form-urlencoded"
        },
        body: "query=" + QUERY
    }

    request.post(options, function (error, response, body) {
        if (response.statusCode != 200) {
            console.log(response.statusCode);
            return -1;
        }
        lines = body.split("\n");
        var i = 1; //drop header

        while (i < lines.length) {
            if (lines[i].length > 4) {
                langcode = lines[i].split("//")[1].split(".")[0];
                streams[langcode].write(lines[i] + "\n");
            }
            i++;
        }
        callback();
    });
}

var loadAll = function (ConfigObject) {
    var properties = {
        CONST_LINEGROUP: 10000,
        CONST_QUERY_P1: encodeURI("SELECT ?wp WHERE { VALUES ?entity {"),
        CONST_QUERY_P2: encodeURI("} ?wp schema:about ?entity FILTER (regex(STR(?wp), \"LANGS\" ))}"),

        CONST_LANG_P1: "(https://",
        CONST_LANG_P2: ".wikipedia)", //usare | tra campi
    }
   
    FOUT = configDataObj.filepath;
    
    CONST_QUERY_P2 = properties.CONST_QUERY_P2.replace(/%22/g, "\"");

    var streams = new Object();
    streams["langs"] = ConfigObject.languages;
    for (var i = 0; i < ConfigObject.languages.length; i++) {
        streams[ConfigObject.languages[i].toLowerCase()] = fs.createWriteStream(FOUT + ConfigObject.languages[i] + ".csv", {
            'flags': 'w'
        });
    }

    var LANGSTRING = "";
    for (var i = 0; i < ConfigObject.languages.length; i++) {
        LANGSTRING += (properties.CONST_LANG_P1 + ConfigObject.languages[i].toLowerCase() + properties.CONST_LANG_P2);
        if (i != (ConfigObject.languages.length - 1)) {
            LANGSTRING += "|";
        }
    }
    properties.CONST_QUERY_P2 = properties.CONST_QUERY_P2.replace("LANGS", LANGSTRING);

    var liner = new lineByLine(configDataObj.filepath+"items.csv");
    line = liner.next(); //drop first line, contains headers
    //console.log("Point 1");
    recursiveAsker(liner, 0, properties, streams);
}


console.log("Loading settings...");
fs.readFile('config.json', function (err, logData) {
    if (err) throw err;

    var text = logData.toString();
    configDataObj = JSON.parse(text);
    console.log("Completed!");
    console.log("===========================================");
    configDataObj.filepath+="1A/"
    load(configDataObj);
});
