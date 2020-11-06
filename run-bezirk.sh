#!/bin/bash
bezirk=$1
date=$2

# rewrite Wien to Wien(Stadt) for Bezirke
bezirkgrep=$bezirk
if [[ "$bezirk" == 'Wien' ]]; then
    bezirkgrep='Wien(Stadt)'
fi

# zipgrep somehow dislikes "(" and ")"
bezirkgrep="${bezirkgrep//\(/\[\(\]}"
bezirkgrep="${bezirkgrep//\)/\[\)\]}"

if [[ "$date" == '' ]]; then
    date="$(date '+%Y-%m-%d')"
fi

> "data/data-${bezirk}.csv"
pathdate="${date//-/}"
for file in coronaDAT/archive/${pathdate}/data/*; do
    zipgrep "${bezirkgrep};" ${file} 'Bezirke.csv' | awk -F';' -v OFS=';' '{print $NF";"$2}' | tr -d '\r' >> "data/data-${bezirk}.csv"
done

sort -o "data/data-${bezirk}.csv" -u "data/data-${bezirk}.csv"
