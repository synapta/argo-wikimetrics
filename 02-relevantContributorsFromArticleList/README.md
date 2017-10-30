Wikimetrics - module 1
======================

This module allows to retrieve the list of the most active users regarding to a list of wikipedia articles in different languages.

Input
-----
```
node run.js
```

To configurate the action of the script, edit the file *config.json*, adjusting the following parameters according to your needs:

* filename: the base name of the files containing the list of articles of interest. The files must hence be named as [FILENAME][LANGCODE].csv
*databaseconfig: the path+filename to a json file containing the fields "user","password","host" for the connection to the wikipedia database
* filepath: the path, relative to the script folder, of the working folder, containing the input and output files.
* languages: list of the language codes of interest (the language code must be the one used in the wikipedia local url, for example English: www.en.wikipedia.org->"en" or "EN"). So, if the list of articles is pertinent to the english version, "EN" must be included in the languages, and the corresponding file containing the list of articles must be named, as said, [FILENAME]EN.csv .

Output
------
The script will save in a file named [FILENAME]"_OUT.csv" the list of the most active users containing, in a comma separated values fashion, the name of the user, the number of edits across the articles of interest, the size of the biggest edit.
