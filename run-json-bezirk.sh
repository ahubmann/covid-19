#!/bin/bash

bezirk=$1

mkdir -p "docs/data/$bezirk"

# rewrite Wien to Wien(Stadt) for Bezirke
bezirkgrep=$bezirk
if [[ "$bezirk" == 'Wien(Stadt)' ]]; then
    bezirkgrep='Wien'
fi

# extract number of inhabitants
numinhabitants=$(zipgrep "${bezirkgrep};" coronaDAT/archive/20201101/data/20201101_230200_orig_csv.zip 'CovidFaelle_GKZ.csv' | awk -F';' -v OFS=';' '{print $3}' | tail -n 1)

items=( )
lastday=''
while IFS=';' read -r date infected; do
	# check day
	day="${date:0:10}"
	if [[ "$lastday" = '' ]]; then
		lastday="$day"
	fi
	if [[ "$lastday" != "$day" ]]; then
		echo "writing $lastday"
		# changed day, need to write out
		IFS=','
		printf '{"inhabitants": %s, "data": [%s]}\n' "$numinhabitants" "${items[*]}" > docs/data/$bezirk/${lastday}.json
		IFS=';'
		lastday="$day"
		items=( )
	fi
	printf -v item '{ "date": "%s", "infected": %s }' "$date" "$infected"
	items+=( "$item" )
done <"data/data-$bezirk.csv"

# write last day
IFS=','
printf '{"inhabitants": %s, "data": [%s]}\n' "$numinhabitants" "${items[*]}" > docs/data/$bezirk/${day}.json
