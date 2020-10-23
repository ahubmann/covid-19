#!/bin/bash

./run-austria.sh force
./run-bezirk.sh "Neusiedl am See"
./run-json-austria.sh
./run-json-bezirk.sh "Neusiedl am See"
