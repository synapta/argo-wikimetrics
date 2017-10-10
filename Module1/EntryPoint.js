var fs = require('fs');
var Module1 = require('./Module1');

console.log("Loading settings...")
fs.readFile('config.json', function (err, logData) {
    if (err) throw err;

    var text = logData.toString();
    configDataObj = JSON.parse(text);
    console.log("Completed!");
    console.log("===========================================");

    Module1.load(configDataObj);
});
