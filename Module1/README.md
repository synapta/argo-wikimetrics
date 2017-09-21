Wikimetrics - module 1
======================

This module allows to fetch all the URLs of language-specific wikipedia articles corresponding to a list of wikidata items resulting from a configurable SPARQL query.

Input
-----

You have to run EntryPoint.js, with no commandline parameters. To configurate the action of the script, edit the file *config.json*, adjusting the following parameters according to your needs:

* filename: the name with the resulting files will be saved
* filepath: the path, relative to the script folder, where the resulting files will be saved. This folder must already exist
* languages: list of the language codes of interest (the language code must be the one used in the wikipedia local url, for example English: www.en.wikipedia.org->"en" or "EN")
* query: the SPARQL query that will be made to the wikidata server to extract the list of entities of interest. The query must return in the **first** column the URI of the wikidata entity of interest.

Output
------

In a first step, the script will save a csv file, named *filename*_step1.csv, containing the list of wikidata entities that satisfy your query, with eventual additional parameters selected by the query written in a comma-separated-values fashion. 

In the second step, the script will save a number of files, named *filename*_step2_LANGUAGECODE.csv containg one url per line of the articles of wikipedia, in the language identified by LANGUAGECODE, corresponding to the list of wikidata entities.