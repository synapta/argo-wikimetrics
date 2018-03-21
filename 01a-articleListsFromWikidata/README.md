Wikimetrics - Article lists from Wikidata
=========================================

This module allows to fetch all the URLs of language-specific Wikipedia articles corresponding to a list of Wikidata items resulting from a configurable SPARQL query.

The example configuration that we offer aims to get the list of English, Deutsch, French, Italian and Allemanish Wikipedia articles with coordinates inside a rectangle that circumscribes the Switzerland.

Input
-----
```
node run.js
```

To configurate the action of the script, edit the file `config.json`, adjusting the following parameters according to your needs:

* `languages`: list of the language codes of interest (the language code must be the one used in the wikipedia local url, for example English: en.wikipedia.org -> "en" or "EN")
* `filepath`: the path to the working folder
* `query`: the path of the SPARQL query file that will be made to the Wikidata server to extract the list of entities of interest. The query must return in the **first** column the URI of the Wikidata entity of interest; the other columns don't matter

Output
------

In a first step, the script will save a csv file in the filepath/1A directory, named `items.csv`, containing the list of Wikidata entities that satisfy your query, with eventual additional parameters selected by the query written in a comma-separated-values fashion.

In the second step, the script will save a number of files in the filepath/1A directory, named `LANGUAGECODE.csv` containg one url per line of the articles of Wikipedia, in the language identified by LANGUAGECODE, corresponding to the list of Wikidata entities.
