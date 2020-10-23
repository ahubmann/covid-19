#!/bin/bash

items=( )
lastday=""
numinhabitants=8858775
while IFS=';' read -r date infected tested hospital hospitalbeds icu icubeds; do
	# check day
	day="${date:0:10}"
	if [[ "$lastday" = "" ]]; then
		lastday="$day"
	fi
	if [[ "$lastday" != "$day" ]]; then
		echo "writing $lastday"
		# changed day, need to write out
		IFS=","
		printf '{"inhabitants": %s, "data": [%s]}\n' "$numinhabitants" "${items[*]}" > docs/data/austria/${lastday}.json
		IFS=";"
		lastday="$day"
		items=( )
	fi
	printf -v item '{ "date": "%s", "infected": %s, "tested": %s, "hospital": %s, "hospitalbeds": %s, "icu": %s, "icubeds": %s }' "$date" "$infected" "$tested" "$hospital" "$hospitalbeds" "$icu" "$icubeds"
	items+=( "$item" )
done <data/data-austria.csv

# write last day
IFS=","
printf '{"inhabitants": %s, "data": [%s]}\n' "$numinhabitants" "${items[*]}" > docs/data/austria/${day}.json
