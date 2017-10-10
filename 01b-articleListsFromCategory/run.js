var fs = require('fs');

console.log("Loading settings...");
fs.readFile('config.json', function (err, logData) {
    if (err) throw err;

    var text = logData.toString();
    configDataObj = JSON.parse(text);
    console.log("Completed!");
    console.log("===========================================");

    //TODO
});
