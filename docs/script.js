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
			block.querySelector(".positiverate").innerText = "(" + Number.parseFloat(positiveRate).toFixed(2) + "%)";
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
	const title = location === "austria" ? "Österreich" : location;
	const outerTemplate = `
		<div class="location mt-5">
			<h1 class="display-4 mb-3">${title}</h1>
			<div class="block row row-cols-1 row-cols-md-2 row-cols-xl-3"></div>
		</div>
	`;
	document.querySelector(".datablock").insertAdjacentHTML("beforeend", outerTemplate);
	const outerBlock = document.querySelector(".datablock").querySelector(".location:last-child").querySelector(".block");
	ranges.forEach(range => {
		const template = `
			<div class="range col mb-4">
			<div class="card">
				<h5 class="card-header">
					${displayRange(range)}
					<button type="button" class="close">&times;</button>
				</h5>
				<div class="card-body">
					<h3 class="text-center font-weight-bold infected"></h3>
					<h5 class="text-center"><span class="tested"></span> <small class="positiverate"></small></h5>
					<div class="text-center rate">
						<span class="text-nowrap mr-1 inzidenzrate"></span>
						<span class="text-nowrap inzidenzrateweek"></span>
					</div>
					<div class="text-center hospital">
						<span class="text-nowrap mr-1 numhospital"></span>
						<span class="text-nowrap numicu"></span>
					</div>
					<canvas class="chart"></canvas>
				</div>
			</div>
			</div>
		`;
		outerBlock.insertAdjacentHTML("beforeend", template);
		const rangeBlock = outerBlock.querySelector(".range:last-child");
		const close = rangeBlock.querySelector(".close");
		close.addEventListener("click", () => {
			updateHash("delete", location, range);
			startup();
		});
		fetchAndDisplay(location, range, rangeBlock);
	});
	
}

function displayRange(range) {
	if (range <= 24) return range + " Stunden";
	return Math.floor(range / 24) + " Tage";
}

function displayDate(date) {
	document.querySelector(".date").innerText = date;
}

function renderSelector() {
	const block = document.querySelector(".selector");
	const selectBezirk = block.querySelector(".bezirke");
	bezirke.forEach(bezirk => {
		const option = document.createElement("option");
		option.setAttribute("value", bezirk);
		option.appendChild(document.createTextNode(bezirk));
		selectBezirk.appendChild(option);
	});
	const selectRange = block.querySelector(".range");
	ranges.forEach(range => {
		const option = document.createElement("option");
		option.setAttribute("value", range);
		option.appendChild(document.createTextNode(displayRange(range)));
		selectRange.appendChild(option);
	});
	const action = block.querySelector(".add-btn");
	action.addEventListener("click", () => {
		const bezirk = selectBezirk.value;
		const range = selectRange.value;
		updateHash("add", bezirk, range);
		startup();
	});
	const clear = block.querySelector(".clear-btn");
	clear.addEventListener("click", () => {
		writeHash([]);
		startup();
	});
}

function updateHash(action, bezirk, range) {
	const data = parseHash();
	let found = false;
	data.forEach(item => {
		if (item.location === bezirk || (item.location === "austria" && bezirk === "Österreich")) {
			if (action === "add") {
				item.ranges.push(range);
				found = true;
			} else if (action === "delete") {
				item.ranges = item.ranges.filter(r => r != range);
			}
		}
	});
	if (! found && action === "add") {
		data.push({location: bezirk, ranges: [range]});
	}
	writeHash(data);
}

function parseHash() {
	const hash = window.location.hash.substring(1);
	const data = [];
	hash.split(";").forEach(locationAndRange => {
		let [location, ranges] = locationAndRange.split("=");
		if (location && ranges) {
			location = location.replaceAll("+", " ").replaceAll("%20", " ");
			ranges = ranges.split(",").map(x => parseInt(x));
			data.push({location, ranges});
		}
	});
	return data;
}

function writeHash(data) {
	let hash = "";
	data.forEach(item => {
		if (item.ranges.length > 0) {
			let location = item.location == "Österreich" ? "austria" : item.location;
			hash += ";" + location + "=" + item.ranges.join(",");
		}
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