#!/bin/bash

force=$1
date=$2

if [[ "$date" = "" ]]; then
  date="2020"
fi

if [[ "$force" = "force" ]]; then
  cd austria-covid-data
  git pull
  cd ..
  $( cd austria-covid-data/manual/ && curl -s https://covid19-dashboard.ages.at/data/data.zip | bsdtar -xvf- )
else

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
fi

grep -R --include 'AllgemeinDaten.csv' "$date" austria-covid-data/* | awk -F';' -v OFS=';' '{print $NF";"$2";"$6";"$10";"$8";"$11";"$9}' | tr -d "\r" | sort -u > "data/data-austria.csv"
