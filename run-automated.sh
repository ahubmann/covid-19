#!/bin/bash

date=$1

bezirke=("Amstetten" "Baden" "Bludenz" "Braunau am Inn" "Bregenz" "Bruck an der Leitha" "Bruck-Mürzzuschlag" "Deutschlandsberg" "Dornbirn" "Eferding" "Eisenstadt(Stadt)" "Eisenstadt-Umgebung" "Feldkirch" "Feldkirchen" "Freistadt" "Gänserndorf" "Gmünd" "Gmunden" "Graz(Stadt)" "Graz-Umgebung" "Grieskirchen" "Güssing" "Hallein" "Hartberg-Fürstenfeld" "Hermagor" "Hollabrunn" "Horn" "Imst" "Innsbruck-Land" "Innsbruck-Stadt" "Jennersdorf" "Kirchdorf an der Krems" "Kitzbühel" "Klagenfurt Land" "Klagenfurt Stadt" "Korneuburg" "Krems an der Donau(Stadt)" "Krems(Land)" "Kufstein" "Landeck" "Leibnitz" "Leoben" "Lienz" "Liezen (inkl. Gröbming)" "Lilienfeld" "Linz(Stadt)" "Linz-Land" "Mattersburg" "Melk" "Mistelbach" "Mödling" "Murau" "Murtal" "Neunkirchen" "Neusiedl am See" "Oberpullendorf" "Oberwart" "Perg" "Reutte" "Ried im Innkreis" "Rohrbach" "Rust(Stadt)" "Salzburg(Stadt)" "Salzburg-Umgebung" "Sankt Johann im Pongau" "Sankt Pölten(Land)" "Sankt Pölten(Stadt)" "Sankt Veit an der Glan" "Schärding" "Scheibbs" "Schwaz" "Spittal an der Drau" "Steyr(Stadt)" "Steyr-Land" "Südoststeiermark" "Tamsweg" "Tulln" "Urfahr-Umgebung" "Villach Land" "Villach Stadt" "Vöcklabruck" "Voitsberg" "Völkermarkt" "Waidhofen an der Thaya" "Waidhofen an der Ybbs(Stadt)" "Weiz" "Wels(Stadt)" "Wels-Land" "Wien(Stadt)" "Wiener Neustadt(Land)" "Wiener Neustadt(Stadt)" "Wolfsberg" "Zell am See" "Zwettl")

if [[ "${date}" == 'today' ]]; then
    date="$(date '+%Y-%m-%d')"
fi

./run-austria.sh force ${date}
./run-json-austria.sh

for bezirk in "${bezirke[@]}"; do
    echo "${bezirk}"
    ./run-bezirk.sh "${bezirk}" "${date}"
    ./run-json-bezirk.sh "${bezirk}"
done

#git add docs/data
#git commit -m "updating data"
#git push origin main
