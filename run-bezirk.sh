#!/bin/bash
bezirk=$1

# rewrite Wien to Wien(Stadt) for Bezirke
bezirkgrep=$bezirk
if [[ "$bezirk" == "Wien" ]]; then
	bezirkgrep="Wien(Stadt)"
fi

echo "Extracting info for ${bezirk}..."

grep -R --include 'Bezirke.csv' "${bezirkgrep};" austria-covid-data/* | awk -F';' -v OFS=';' '{print $NF";"$2}' | tr -d "\r" | sort -u > "data/data-${bezirk}.csv"

# extract last datapoint per day
sort -r "data/data-${bezirk}.csv" | awk -F';' -v OFS=';' '{print $2" "$1}' | sed -e 's/\(.*\)T.*/\1/g' | uniq -f 1 | awk -F' ' -v OFS=' ' '{print $2";"$1}' | sort > "data/data-${bezirk}-day.csv"

# extract number of inhabitants
numinhabitants=$(grep -R --include 'CovidFaelle_GKZ.csv' "${bezirk};" austria-covid-data/* | awk -F';' -v OFS=';' '{print $3}' | tail -n 1)

data1week=$(tail -n 169 "data/data-${bezirk}.csv" | head -n 1 | awk -F';' -v OFS=';' '{print $2}')
data1day=$(tail -n 25 "data/data-${bezirk}.csv" | head -n 1 | awk -F';' -v OFS=';' '{print $2}')
datanow=$(tail -n 25 "data/data-${bezirk}.csv" | tail -n 1 | awk -F';' -v OFS=';' '{print $2}')

echo "Latest data:"

tail -n 25 "data/data-${bezirk}.csv"

# incidents
incidentsday=$( echo "scale=2; ($(($datanow-$data1day)) * 100000) / $numinhabitants" | bc -l)
incidentsweek=$( echo "scale=2; ($(($datanow-$data1week)) * 100000) / $numinhabitants" | bc -l)

echo
echo "New cases in 24 hours: $(($datanow-$data1day)) [$incidentsday]"
echo "New cases in 24 hours (7 day average): $((($datanow-$data1week)/7)) [$incidentsweek]"

