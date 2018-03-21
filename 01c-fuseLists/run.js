var fs = require('fs');
var lineByLine = require('n-readlines');
var HashSet=require('hashset');
console.log("Loading settings...");
fs.readFile('config.json', function (err, logData) {
    if (err) throw err;

    var text = logData.toString();
    configDataObj = JSON.parse(text);
    configDataObj.output="1C/";
    if (!fs.existsSync(configDataObj.filepath+configDataObj.output)){
        fs.mkdirSync(configDataObj.filepath+configDataObj.output);
    }
    console.log("Completed!");
    console.log("===========================================");
    var i=0;
    var list;
    while(i<configDataObj.languages.length)
    {
        console.log("Fusing "+configDataObj.languages[i]+"...");
        var liner = new lineByLine(configDataObj.filepath+"1A/"+configDataObj.languages[i]+".csv");
        var line;
        list=new HashSet();
        while(line = liner.next())
        {
            list.add(line.toString());
        }
        var liner = new lineByLine(configDataObj.filepath+"1B/"+configDataObj.languages[i]+".csv");
        while(line = liner.next())
        {
            list.add(line.toString());
        }
        console.log(list.length)
        var arr=list.toArray();
        var k=0;
        var FOUT=configDataObj.filepath+configDataObj.output+configDataObj.languages[i]+".csv";
      
        console.log(arr.length)
        while(k<arr.length)
        {
            fs.appendFileSync(FOUT,arr[k]+"\n");
            k++;
        }
        i++;
    }
});
