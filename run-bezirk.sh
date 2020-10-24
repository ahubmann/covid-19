#!/bin/bash
bezirk=$1
date=$2

# rewrite Wien to Wien(Stadt) for Bezirke
bezirkgrep=$bezirk
if [[ "$bezirk" == "Wien" ]]; then
	bezirkgrep="Wien(Stadt)"
fi

if [[ "$date" = "" ]]; then
	date="data-*"
else
	date="data-$date-*"
fi
grep -R --include 'Bezirke.csv' "${bezirkgrep};" austria-covid-data/data/$date austria-covid-data/manual/ | awk -F';' -v OFS=';' '{print $NF";"$2}' | tr -d "\r" | sort -u > "data/data-${bezirk}.csv"
