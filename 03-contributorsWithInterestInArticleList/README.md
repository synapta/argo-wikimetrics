Wikimetrics - Contributors interest in article list
===================================================

This module allows to, provided a list of users, to rank and classify them according to their activity regarding a list of wikipedia articles.

Input
-----
```
node run.js
```

To configurate the action of the script, edit the file *config.json*, adjusting the following parameters according to your needs:

* `blackPages`: an array of optional (can be blank) filenames of csv files containing a list of wikipedia articles that the desidered class of user should not have edited (an edit on them give a penality to the user's rank)
* `databaseconfig`: the path+filename to a json file containing the fields "user","password","host" for the connection to the wikipedia database
* `filepath`: the path, relative to the script folder, of the working folder, containing the input and output files.
* `languages`: list of the language codes of interest (the language code must be the one used in the wikipedia local url, for example English: www.en.wikipedia.org->"en" or "EN"). 

Output
------
The script will save in the folder filepath/3 a file named users.csv containing various stats in csv format for each user describing his activity.
