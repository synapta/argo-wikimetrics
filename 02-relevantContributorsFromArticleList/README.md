Wikimetrics - Relevant contributors from list of articles
=========================================================

This module allows to retrieve the list of the most active users regarding to a list of wikipedia articles in different languages.

Input
-----
```
node run.js
```

To configurate the action of the script, edit the file *config.json*, adjusting the following parameters according to your needs:

* `databaseconfig`: the path+filename to a json file containing the fields "user","password","host" for the connection to the wikipedia database
* `filepath`: the path of the working folder.
* `languages`: list of the language codes of interest (the language code must be the one used in the wikipedia local url, for example English: www.en.wikipedia.org->"en" or "EN").
* `continueFromModule`: The module after this one is run. Default C, can be A or B
* `minEditNumber`: Users with less than this number of edits on the pages of interest will be filtered out
* `minEditSize`: Users without at least one additive edit of the this size will be filtered out (probably patrollers)
* `oldestAcceptedEdit`:  Edits older than this timestamp won’t be counted (restrict to the users engaged in the topic in recent times)
* `latestActivity`: Users without an edit after this timestamp will be filtered out

Output
------
The script will save in  the folder filepath/2 a file named "users.csv" the list of the most active users containing, in a comma separated values fashion, the name of the user, the number of edits across the articles of interest, the size of the biggest edit, the latest edit over the articles.
