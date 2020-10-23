#!/bin/bash

echo "Pull data?"
select yn in "Yes" "No"; do
  case $yn in
    Yes)
      echo "Pulling new data ..."
      cd austria-covid-data
      git pull
      cd ..
      break;;
    No) break;;
  esac
done

echo "Fetch directly?"
select yn in "Yes" "No"; do
  case $yn in
    Yes)
      echo
      echo "Fetching newest data directly..."
      $( cd austria-covid-data/manual/ && curl -s https://covid19-dashboard.ages.at/data/data.zip | bsdtar -xvf- )
      break;;
    No) break;;
  esac
done

grep -R --include 'AllgemeinDaten.csv' "2020" austria-covid-data/* | awk -F';' -v OFS=';' '{print $NF";"$2";"$6";"$10";"$8";"$11";"$9}' | tr -d "\r" | sort -u > "data/data-austria.csv"

# extract last datapoint per day
sort -r "data/data-austria.csv" | awk -F';' -v OFS=';' '{print $2" " $3" " $4" " $5" "$6" "$7" "$1}' | sed -e 's/\(.*\)T.*/\1/g' | uniq -f 6 | awk -F' ' -v OFS=' ' '{print $7";"$1";"$2";"$3";"$4";"$5";"$6}' | sort > "data/data-austria-day.csv"

echo "Latest data:"

data1week=$(tail -n 169 "data/data-austria.csv" | head -n 1 | awk -F';' -v OFS=';' '{print $2}')
data1day=$(tail -n 25 "data/data-austria.csv" | head -n 1 | awk -F';' -v OFS=';' '{print $2}')
datanow=$(tail -n 25 "data/data-austria.csv" | tail -n 1 | awk -F';' -v OFS=';' '{print $2}')

tests1week=$(tail -n 169 "data/data-austria.csv" | head -n 1 | awk -F';' -v OFS=';' '{print $3}')
tests1day=$(tail -n 25 "data/data-austria.csv" | head -n 1 | awk -F';' -v OFS=';' '{print $3}')
testsnow=$(tail -n 25 "data/data-austria.csv" | tail -n 1 | awk -F';' -v OFS=';' '{print $3}')

beds1week=$(tail -n 169 "data/data-austria.csv" | head -n 1 | awk -F';' -v OFS=';' '{print $4}')
beds1day=$(tail -n 25 "data/data-austria.csv" | head -n 1 | awk -F';' -v OFS=';' '{print $4}')
bedsnow=$(tail -n 25 "data/data-austria.csv" | tail -n 1 | awk -F';' -v OFS=';' '{print $4}')

icu1week=$(tail -n 169 "data/data-austria.csv" | head -n 1 | awk -F';' -v OFS=';' '{print $6}')
icu1day=$(tail -n 25 "data/data-austria.csv" | head -n 1 | awk -F';' -v OFS=';' '{print $6}')
icunow=$(tail -n 25 "data/data-austria.csv" | tail -n 1 | awk -F';' -v OFS=';' '{print $6}')

tail -n 25 "data/data-austria.csv"

numinhabitants=8858775

# incidents
incidentsday=$( echo "scale=2; ($(($datanow-$data1day)) * 100000) / $numinhabitants" | bc -l )
incidentsweek=$( echo "scale=2; ($(($datanow-$data1week)) * 100000) / $numinhabitants" | bc -l )

casepercent=$( echo "scale=2; $((($datanow-$data1day)*100))/$(($testsnow-$tests1day))" | bc -l )
casepercent1week=$( echo "scale=2; $((($datanow-$data1week)*100))/$(($testsnow-$tests1week))" | bc -l )

echo
echo "New cases in 24 hours: $(($datanow-$data1day)) ($(($testsnow-$tests1day))), ${casepercent}% [$incidentsday]"
echo "New cases in 24 hours (7 day average): $((($datanow-$data1week)/7)) ($(( ($testsnow-$tests1week) / 7 ))), ${casepercent1week}% [$incidentsweek]"

echo
echo "Hospital beds in 24 hours: $(($bedsnow-$beds1day))"
echo "Hospital beds in 24 hours (7 day average): $((($bedsnow-$beds1week)/7))"

echo
echo "ICU beds in 24 hours: $(($icunow-$icu1day))"
echo "ICU beds in 24 hours (7 day average): $((($icunow-$icu1week)/7))"
