Wikimetrics - Article lists from category tree
==============================================

This module allows to merge what is produced by the precedent 2 modules removing duplicates.

Input
-----
```
node run.js
```

To configurate the action of the script, edit the file `config.json`, adjusting the following parameters according to your needs:

* `languages`: list of the language codes of interest (the language code must be the one used in the wikipedia local url, for example English: www.en.wikipedia.org->"en" or "EN")
* `filepath`: the path to the working folder


Output
------

The script will save a number of files in the filepath/1C directory, named `LANGUAGECODE.csv` containg one url per line of the articles of Wikipedia, in the language identified by LANGUAGECODE.
