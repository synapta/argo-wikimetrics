Wikimetrics - module 1
======================

This module allows to, provided a list of users, to rank and classify them according to their activity regarding a list of wikipedia articles.

Input
-----
```
node run.js
```

To configurate the action of the script, edit the file *config.json*, adjusting the following parameters according to your needs:

* whitePages: array of filenames of the csv files containing the articles of interest
* blackPages: an array of optional (can be blank) filenames of csv files containing a list of wikipedia articles that the desidered class of user should not have edited (an edit on them give a penality to the user's rank)
* usersFilename: the name of the csv file containing the list of users of interest
* databaseconfig: the path+filename to a json file containing the fields "user","password","host" for the connection to the wikipedia database
* filepath: the path, relative to the script folder, of the working folder, containing the input and output files.
* languages: list of the language codes of interest (the language code must be the one used in the wikipedia local url, for example English: www.en.wikipedia.org->"en" or "EN"). So, if the list of articles is pertinent to the english version, "EN" must be included in the languages, and the corresponding file containing the list of articles must be named, as said, [FILENAME]EN.csv .

Output
------
The script will save in a file named USERSOUT.json" an array of users with //dipende cosa ci mettiamo nella versione finale
