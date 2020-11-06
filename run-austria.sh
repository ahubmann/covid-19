#!/bin/bash

force=$1
date=$2

if [[ "${date}" == '' ]]; then
    date="$(date '+%Y-%m-%d')"
fi

if [[ "${force}" == 'skip' ]]; then
    :
elif [[ "${force}" == 'force' ]]; then
    cd coronaDAT
    git pull
    cd ..
else
    echo 'Pull data?'
    select yn in 'Yes' 'No'; do
        case $yn in
            Yes)
                echo 'Pulling new data ...'
                cd coronaDAT
                git pull
                cd ..
                break;;
            No) break;;
        esac
    done
fi

> 'data/data-austria.csv'
pathdate="${date//-/}"
for file in coronaDAT/archive/${pathdate}/data/*; do
    zipgrep "${date}" ${file} 'AllgemeinDaten.csv' | awk -F';' -v OFS=';' '{print $NF";"$2";"$6";"$10";"$8";"$11";"$9}' | tr -d '\r' >> 'data/data-austria.csv'
done

sort -o 'data/data-austria.csv' -u 'data/data-austria.csv'
