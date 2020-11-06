import "./chart.js/Chart.bundle.min.js";

const bezirke = ["Österreich", "Amstetten", "Baden", "Bludenz", "Braunau am Inn", "Bregenz", "Bruck an der Leitha", "Bruck-Mürzzuschlag", "Deutschlandsberg", "Dornbirn", "Eferding", "Eisenstadt(Stadt)", "Eisenstadt-Umgebung", "Feldkirch", "Feldkirchen", "Freistadt", "Gänserndorf", "Gmünd", "Gmunden", "Graz(Stadt)", "Graz-Umgebung", "Grieskirchen", "Güssing", "Hallein", "Hartberg-Fürstenfeld", "Hermagor", "Hollabrunn", "Horn", "Imst", "Innsbruck-Land", "Innsbruck-Stadt", "Jennersdorf", "Kirchdorf an der Krems", "Kitzbühel", "Klagenfurt Land", "Klagenfurt Stadt", "Korneuburg", "Krems an der Donau(Stadt)", "Krems(Land)", "Kufstein", "Landeck", "Leibnitz", "Leoben", "Lienz", "Liezen (inkl. Gröbming)", "Lilienfeld", "Linz(Stadt)", "Linz-Land", "Mattersburg", "Melk", "Mistelbach", "Mödling", "Murau", "Murtal", "Neunkirchen", "Neusiedl am See", "Oberpullendorf", "Oberwart", "Perg", "Reutte", "Ried im Innkreis", "Rohrbach", "Rust(Stadt)", "Salzburg(Stadt)", "Salzburg-Umgebung", "Sankt Johann im Pongau", "Sankt Pölten(Land)", "Sankt Pölten(Stadt)", "Sankt Veit an der Glan", "Schärding", "Scheibbs", "Schwaz", "Spittal an der Drau", "Steyr(Stadt)", "Steyr-Land", "Südoststeiermark", "Tamsweg", "Tulln", "Urfahr-Umgebung", "Villach Land", "Villach Stadt", "Vöcklabruck", "Voitsberg", "Völkermarkt", "Waidhofen an der Thaya", "Waidhofen an der Ybbs(Stadt)", "Weiz", "Wels(Stadt)", "Wels-Land", "Wien(Stadt)", "Wiener Neustadt(Land)", "Wiener Neustadt(Stadt)", "Wolfsberg", "Zell am See", "Zwettl"]
const ranges = [24, 7*24, 30*24];

async function fetchDatapoints(location, numPoints) {
	const date = new Date();
	let data = [];
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
		date.setDate(date.getDate() - 1);
		// make sure we have consecutive datapoints
		// if not, interpolate data
		data = interpolate(data);
	}
	data.reverse();
	return { inhabitants, data: data.slice(0, numPoints) };
}

function interpolate(data) {
	let previous = null;
	let interpolatedData = [];
	data.forEach((item, i) => {
		if (i == 0) {
			previous = item;
			interpolatedData.push(item);
			return;
		}
		let previousDate = getDate(previous.date);
		let itemDate = getDate(item.date)
		let timeDiff = itemDate.getTime() - previousDate.getTime();
		if (timeDiff > 2.5 * 60 * 60 * 1000) {
			// more than 1 hour, but we need hourly data
			let missedHours = timeDiff / (60 * 60 * 1000);
			let steps = {};
			for (const [key, value] of Object.entries(item)) {
				if (key == "date") {
					continue;
				}
				steps[key] = (item[key] - previous[key]) / missedHours;
			}
			for (let hour = 1; hour < missedHours; hour++) {
				let newDate = new Date(previousDate);
				newDate.setHours(newDate.getHours() + hour);
				let newItem = {
					date: isoDate(newDate)
				};
				for (const [key, value] of Object.entries(steps)) {
					newItem[key] = Math.round(previous[key] + hour * steps[key]);
				}
				interpolatedData.push(newItem);
			}
		}
		interpolatedData.push(item);
		previous = item;
	});
	return interpolatedData;
}

function getDate(date) {
	// format is yyyy-mm-ddThh:mm:ss
	let year = Number.parseInt(date.substring(0,4));
	let month = Number.parseInt(date.substring(5,7)) - 1;
	let day = Number.parseInt(date.substring(8,10));
	let hour = Number.parseInt(date.substring(11,13));
	let minute = Number.parseInt(date.substring(14,16));
	let second = Number.parseInt(date.substring(17,19));

	return new Date(year, month, day, hour, minute, second);
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
		const inzidenzRate = infected / hours * 24 / data.inhabitants * 100000;
		const inzidenzRateWeek = inzidenzRate * 7;
		if (now.tested) {
			tested = now.tested - then.tested;
			positiveRate = (infected / tested) * 100;
		}
		let hospital = 0;
		let icu = 0;
		if (now.hospital) {
			hospital = now.hospital - then.hospital;
			icu = now.icu - then.icu;
		}

		block.querySelector(".infected").innerText = infected >= 0 ? "+" + infected : infected;
		if (now.tested) {
			block.querySelector(".tested").innerText = tested + " Tests";
			block.querySelector(".positiverate").innerText = Number.parseFloat(positiveRate).toFixed(2) + "% positiv";
		}
		if (now.hospital) {
			block.querySelector(".numhospital").innerText = (hospital >= 0 ? "+" + hospital : hospital) + " Spital = " + now.hospital;
			block.querySelector(".numicu").innerText = (icu > 0 ? "+" + icu : icu) + " Intensiv = " + now.icu;
		}
		block.querySelector(".inzidenzrate").innerText = Number.parseFloat(inzidenzRate).toFixed(2) + "/Tag";
		block.querySelector(".inzidenzrateweek").innerText = Number.parseFloat(inzidenzRateWeek).toFixed(2) + "/Woche";
		displayDate(now.date);

		const canvas = block.querySelector(".chart").getContext("2d");
		const datasets = [{
			data: getDataForChart(Array.from(data.data)),
			type: "bar",
			yAxisID: "points"
		}];
		const yAxes = [{
			type: "linear",
			display: true,
			id: "points",
			position: "left",
			ticks: {
				beginAtZero: true
			}
		}];
		if (hours > 25) {
			datasets.push({
				data: getDataForChart(Array.from(data.data), 24),
				type: "line",
				yAxisID: "averaging",
				fill: false
			});
			yAxes.push({
				type: "linear",
				display: true,
				id: "averaging",
				position: "right",
				gridLines: {
					drawOnChartArea: false
				},
				ticks: {
					beginAtZero: true
				}
			});
		}
		new Chart(canvas, {
			type: "bar",
			data: {
				labels: data.data.map(d => d.date).reverse().slice(1),
				datasets: datasets
			},
			options: {
				responsive: true,
				stacked: false,
				legend: {
					display: false
				},
				scales: {
					xAxes: [{
						type: "time"
					}],
					yAxes: yAxes
				}
			}
		});
	});
}

function getDataForChart(data, averaging) {
	const chartData = [];
	let previous = -1;

	data.reverse().map(d => d.infected).forEach((item, i) => {
		if (i == 0) {
			previous = item;
			return;
		}
		let change = item - previous;
		if (Math.abs(change) > 5000) {
			change = null;
		}
		chartData.push(change);
		previous = item;
	});

	if (averaging) {
		const averagedChartData = [];
		previous = [];
		chartData.forEach(item => {
			previous.push(item);
			if (previous.length < averaging) {
				averagedChartData.push(null);
			} else {
				averagedChartData.push(previous.reduce((acc, value) => acc + value, 0));
				previous.shift();
			}
		});
		return averagedChartData;
	}
	return chartData;
}

function fetchDate(date) {
	let day = date.getDate();
	if (day < 10) day = "0" + day;
	let month = date.getMonth() + 1;
	if (month < 10) month = "0" + month;
	let year = date.getFullYear();
	return `${year}-${month}-${day}`;
}

function isoDate(date) {
	let datePart = fetchDate(date);
	let hours = date.getHours();
	if (hours < 10) hours = "0" + hours;
	let minutes = date.getMinutes();
	if (minutes < 10) minutes = "0" + minutes;
	let seconds = date.getSeconds();
	if (seconds < 10) seconds = "0" + seconds;
	return `${datePart}T${hours}:${minutes}:${seconds}`;
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

		const hospital = document.createElement("div");
		hospital.setAttribute("class", "hospital");
		const hospitalOccupancy = document.createElement("span");
		hospitalOccupancy.setAttribute("class", "numhospital");
		hospital.appendChild(hospitalOccupancy);
		const icuOccupancy = document.createElement("span");
		icuOccupancy.setAttribute("class", "numicu");
		hospital.appendChild(icuOccupancy);
		rangeBlock.appendChild(hospital);

		const chartCanvas = document.createElement("canvas");
		chartCanvas.setAttribute("class", "chart");
		rangeBlock.appendChild(chartCanvas);

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