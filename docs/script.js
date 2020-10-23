(function() {
	async function fetchDatapoints(location, numHours) {
		let date = new Date();
		const data = [];
		let inhabitants = 0;
		while (data.length < numHours) {
			let fetchdate = date.toISOString().replace(/(.*)T.*/, "$1");
			let json = await fetchData(fetchdate, location);
			data.unshift(...json.data);
			inhabitants = json.inhabitants
			date.setDate(date.getDate()-1);
		}
		data.reverse();
		return { inhabitants, data };
	}
	
	function fetchData(date, location) {
		return fetch("data/" + location + "/" + date + ".json").then(res => res.json());
	}

	function fetchAndDisplay(location, hours, selector) {
		fetchDatapoints(location, hours).then(data => {
			console.log(data);
			// first and xth item
			let now = data.data[0];
			let then = data.data[hours];
			let infected = now.infected - then.infected;
			let tested = 0;
			let positiveRate = 0;
			let inzidenzRate = infected / data.inhabitants * 100000;
			if (now.tested) {
				tested = now.tested - then.tested;
				positiveRate = (infected / tested) * 100;
			}
			console.log(now.date);
			document.querySelector(".date").innerText = now.date;
			document.querySelector(selector + " .infected").innerText = infected >= 0 ? "+" + infected : "-" + infected;
			if (now.tested) {
				document.querySelector(selector + " .tested").innerText = tested;
				document.querySelector(selector + " .positiverate").innerText = Number.parseFloat(positiveRate).toFixed(2) + "%";
			}
			document.querySelector(selector + " .inzidenzrate").innerText = Number.parseFloat(inzidenzRate).toFixed(2);
		});
	}

	function displayDate(date) {
		let day = date.getDate();
		if (day < 10) day = "0" + day;
		let month = date.getMonth();
		if (month < 10) month = "0" + month;
		let year = date.getFullYear()
		let hour = date.getHours();
		if (hour < 10) hour = "0" + hour;
		let minute = date.getMinutes();
		if (minute < 10) minute = "0" + minute;

		return `${day}.${month}.${year} ${hour}:${minute}`
	}

	fetchAndDisplay("austria", 24, ".austria ._24hours");
	fetchAndDisplay("austria", 24 * 7, ".austria ._7days");
	fetchAndDisplay("Neusiedl am See", 24, ".neusiedlamsee ._24hours");
	fetchAndDisplay("Neusiedl am See", 24 * 7, ".neusiedlamsee ._7days");
})();