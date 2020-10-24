(function() {
	const bezirke = ["Österreich", "Amstetten", "Baden", "Bludenz", "Braunau am Inn", "Bregenz", "Bruck an der Leitha", "Bruck-Mürzzuschlag", "Deutschlandsberg", "Dornbirn", "Eferding", "Eisenstadt(Stadt)", "Eisenstadt-Umgebung", "Feldkirch", "Feldkirchen", "Freistadt", "Gänserndorf", "Gmünd", "Gmunden", "Graz(Stadt)", "Graz-Umgebung", "Grieskirchen", "Güssing", "Hallein", "Hartberg-Fürstenfeld", "Hermagor", "Hollabrunn", "Horn", "Imst", "Innsbruck-Land", "Innsbruck-Stadt", "Jennersdorf", "Kirchdorf an der Krems", "Kitzbühel", "Klagenfurt Land", "Klagenfurt Stadt", "Korneuburg", "Krems an der Donau(Stadt)", "Krems(Land)", "Kufstein", "Landeck", "Leibnitz", "Leoben", "Lienz", "Liezen (inkl. Gröbming)", "Lilienfeld", "Linz(Stadt)", "Linz-Land", "Mattersburg", "Melk", "Mistelbach", "Mödling", "Murau", "Murtal", "Neunkirchen", "Neusiedl am See", "Oberpullendorf", "Oberwart", "Perg", "Reutte", "Ried im Innkreis", "Rohrbach", "Rust(Stadt)", "Salzburg(Stadt)", "Salzburg-Umgebung", "Sankt Johann im Pongau", "Sankt Pölten(Land)", "Sankt Pölten(Stadt)", "Sankt Veit an der Glan", "Schärding", "Scheibbs", "Schwaz", "Spittal an der Drau", "Steyr(Stadt)", "Steyr-Land", "Südoststeiermark", "Tamsweg", "Tulln", "Urfahr-Umgebung", "Villach Land", "Villach Stadt", "Vöcklabruck", "Voitsberg", "Völkermarkt", "Waidhofen an der Thaya", "Waidhofen an der Ybbs(Stadt)", "Weiz", "Wels(Stadt)", "Wels-Land", "Wien(Stadt)", "Wiener Neustadt(Land)", "Wiener Neustadt(Stadt)", "Wolfsberg", "Zell am See", "Zwettl"]
	const ranges = [24, 7*24, 30*24];

	async function fetchDatapoints(location, numPoints) {
		const date = new Date();
		const data = [];
		let inhabitants = 0;
		let circuitBreaker = 300;
		while (data.length < numPoints && circuitBreaker > 0) {
			circuitBreaker--;
			try {
				const response = await fetchData(location, date);
				data.unshift(...response.data);
				inhabitants = response.inhabitants
			} catch (ex) {
			}
			date.setDate(date.getDate()-1);
		}
		data.reverse();
		return { inhabitants, data };
	}

	async function fetchData(location, date) {
		const fetchdate = fetchDate(date);
		const response = await fetch("data/" + location + "/" + fetchdate + ".json");
		if (response.ok) {
			return Promise.resolve(response.json());
		}
		return Promise.reject("invalid response");
	}

	function fetchAndDisplay(location, hours, block) {
		fetchDatapoints(location, hours + 1).then(data => {
			// first and xth item
			const now = data.data[0];
			const then = data.data[hours];
			const infected = now.infected - then.infected;
			let tested = 0;
			let positiveRate = 0;
			const inzidenzRate = infected / data.inhabitants * 100000;
			const inzidenzRateWeek = inzidenzRate / hours * 24 * 7;
			if (now.tested) {
				tested = now.tested - then.tested;
				positiveRate = (infected / tested) * 100;
			}
			block.querySelector(".infected").innerText = infected >= 0 ? "+" + infected : "-" + infected;
			if (now.tested) {
				block.querySelector(".tested").innerText = tested;
				block.querySelector(".positiverate").innerText = Number.parseFloat(positiveRate).toFixed(2) + "%";
			}
			block.querySelector(".inzidenzrate").innerText = Number.parseFloat(inzidenzRate).toFixed(2);
			block.querySelector(".inzidenzrateweek").innerText = "[" + Number.parseFloat(inzidenzRateWeek).toFixed(2) + "]";
			displayDate(now.date);
		});
	}

	function fetchDate(date) {
		let day = date.getDate();
		if (day < 10) day = "0" + day;
		let month = date.getMonth() + 1;
		if (month < 10) month = "0" + month;
		let year = date.getFullYear()
		return `${year}-${month}-${day}`
	}

	function createHTML(location, ranges) {
		const outerBlock = document.createElement("div");
		outerBlock.setAttribute("class", "block");
		const title = document.createElement("div");
		title.setAttribute("class", "title");
		title.innerHTML = location == "austria" ? "Österreich" : location;
		outerBlock.appendChild(title);
		ranges.forEach(range => {
			const rangeBlock = document.createElement("div");
			rangeBlock.setAttribute("class", "range");

			const rangeTitle = document.createElement("div");
			rangeTitle.setAttribute("class", "title2");
			rangeTitle.innerHTML = displayRange(range);
			rangeBlock.appendChild(rangeTitle);

			const infected = document.createElement("div");
			infected.setAttribute("class", "infected");
			rangeBlock.appendChild(infected);

			const tested = document.createElement("div");
			tested.setAttribute("class", "tested");
			rangeBlock.appendChild(tested);

			const rateBlock = document.createElement("div");
			rateBlock.setAttribute("class", "rate");
			rangeBlock.appendChild(rateBlock);

			const positiverate = document.createElement("span");
			positiverate.setAttribute("class", "positiverate");
			rateBlock.appendChild(positiverate);

			const inzidenzrate = document.createElement("span");
			inzidenzrate.setAttribute("class", "inzidenzrate");
			rateBlock.appendChild(inzidenzrate);

			const inzidenzrateweek = document.createElement("span");
			inzidenzrateweek.setAttribute("class", "inzidenzrateweek");
			rateBlock.appendChild(inzidenzrateweek);

			outerBlock.appendChild(rangeBlock);
			fetchAndDisplay(location, range, rangeBlock);
		});
		document.querySelector(".datablock").appendChild(outerBlock);
	}

	function displayRange(range) {
		if (range <= 24) return range + " Stunden";
		return Math.floor(range / 24) + " Tage";
	}

	function displayDate(date) {
		document.querySelector(".date").innerText = date;
	}

	function renderSelector() {
		const block = document.createElement("div");
		block.setAttribute("class", "selector");
		const selectBezirk = document.createElement("select");
		selectBezirk.setAttribute("class", "bezirke");
		block.appendChild(selectBezirk);
		bezirke.forEach(bezirk => {
			const option = document.createElement("option");
			option.setAttribute("value", bezirk);
			option.appendChild(document.createTextNode(bezirk));
			selectBezirk.appendChild(option);
		});
		const selectRange = document.createElement("select");
		selectRange.setAttribute("class", "range");
		block.appendChild(selectRange);
		ranges.forEach(range => {
			const option = document.createElement("option");
			option.setAttribute("value", range);
			option.appendChild(document.createTextNode(displayRange(range)));
			selectRange.appendChild(option);
		});
		const action = document.createElement("button");
		action.setAttribute("class", "action");
		action.appendChild(document.createTextNode("GO"));
		block.appendChild(action);
		action.addEventListener("click", () => {
			const bezirk = selectBezirk.value;
			const range = selectRange.value;

			const data = parseHash();
			let found = false;
			data.forEach(item => {
				if (item.location == bezirk || (item.location == "austria" && bezirk == "Österreich")) {
					item.ranges.push(range);
					found = true;
				}
			});
			if (! found) {
				data.push({location: bezirk, ranges: [range]});
			}
			writeHash(data);
			startup();
		});
		const clear = document.createElement("button");
		clear.setAttribute("class", "action");
		clear.appendChild(document.createTextNode("Clear"));
		block.appendChild(clear);
		clear.addEventListener("click", () => {
			writeHash([]);
			startup();
		});

		document.querySelector(".selectorblock").appendChild(block);
	}

	function parseHash() {
		const hash = window.location.hash.substring(1);
		const data = [];
		hash.split(";").forEach(locationAndRange => {
			let [location, ranges] = locationAndRange.split("=");
			if (location && ranges) {
				location = location.replaceAll("+", " ");
				ranges = ranges.split(",").map(x => parseInt(x));
				data.push({location, ranges});
			}
		});
		return data;
	}

	function writeHash(data) {
		let hash = "";
		data.forEach(item => {
			let location = item.location == "Österreich" ? "austria" : item.location;
			hash += ";" + location + "=" + item.ranges.join(",");
		});
		window.location.hash = hash;
	}

	function startup() {
		document.querySelector(".datablock").innerHTML = "";
		if (window.location.hash) {
			parseHash().forEach(location => {
				createHTML(location.location, location.ranges);
			});
		}
	}

	renderSelector();
	startup();
})();