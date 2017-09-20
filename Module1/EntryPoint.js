#!javascript
console.log("Loading Settings...")
var fs = require('fs');
var Module1=require('./Module1');
//TODO: 1- rimuovere step intermedio, anzichè salvando su file splittando direttamente il body e passandolo?
fs.readFile('config.json', function (err, logData) 
{
    if (err) throw err;
    var text = logData.toString();
    ConfigdataObj=JSON.parse(text);
    console.log("Completed. Calling Module 1...")
    //UNLOCK WHEN DEVELOPED
    var step1Ris=Module1.load(ConfigdataObj);
   //Module1.loadAll(ConfigdataObj);
});
