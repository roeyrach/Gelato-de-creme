let navbar = document.querySelector(".header .navbar")
let menuBtn = document.querySelector("#menu-btn")

menuBtn.onclick = () => {
	menuBtn.classList.toggle("fa-times")
	navbar.classList.toggle("active")
}

window.onscroll = () => {
	menuBtn.classList.remove("fa-times")
	navbar.classList.remove("active")
}

var swiper = new Swiper(".home-slider", {
	grabCursor: true,
	loop: true,
	centeredSlides: true,
	navigation: {
		nextEl: ".swiper-button-next",
		prevEl: ".swiper-button-prev",
	},
})

var swiper = new Swiper(".reviews-slider", {
	pagination: {
		el: ".swiper-pagination",
		clickable: true,
	},
	grabCursor: true,
	loop: true,
	spaceBetween: 20,
	breakpoints: {
		0: {
			slidesPerView: 1,
		},
		768: {
			slidesPerView: 2,
		},
		991: {
			slidesPerView: 3,
		},
	},
})
function check(){
	$.get('cartSessionParams',function(data,status){
		$.each(data, function(key,val) {
			console.log(data);
			$("#text1").text("Hello " + data[key]);
		}
		)});
}
function showData(){
	$("#users").css('visibility','visible');
	$("#btnShow").css('visibility','hidden');
	$.get('showData',function(data,status){
		for (let i=0; i< data.length; i++){
			var row = "<tr><td>" + data[i].fullname + "</td><td>" + data[i].email + "</td><td>" + data[i].admin + "</td></tr>";
			$("#userstable").append(row);
		}
	});
}
function showIceCreamsList(){
	event.preventDefault();
	$("#iceCreams").css('visibility','visible');
	$("#toMyCart").css('visibility','visible');
	$("#spName").css('visibility','visible');
	$("#nameinp").css('visibility','visible');
	$.get('/adminMenu/showIceCreamsList',function(data,status){
		for (let i=0; i< data.length; i++){
			var row = "<tr>"
						+"<td>" + data[i].name + "</td>"
						+"<td>" + data[i].flavor + "</td>"
						+"<td>" + data[i].quantity + "</td>"
						+"<td>" + data[i].price +"$</td>"
						+"<td><img style='width:130px'; src='" + data[i].photoURL + "'></td>"+
						"</tr>";
			$("#iceCreamsTable").append(row);
		}
		console.log(row);
	});
}
function selectedIceCreamsDisplay(){
	$("#btnSec2").css('visibility','hidden');
	$("#btnFinishOrder").css('visibility','visible');
	let arr = $.get("/selectedIceCreams",function(data,status){
		for (let i =0; i<data.length; i++){
			const str = data[i].split("_");
			const name = str[0];
			const quantity = str[1];
			$("#sec2").append("<br><div class='card'><img src='https://avirtualvegan.com/wp-content/uploads/2015/05/DSC_0209.jpg' alt='Avatar' style='width:30%';><div class='container'><h1><b>" + name +"</b></h1><p>" + quantity + " kilos" + "</p></div></div><br>");
		}
	})
}
function searchIceCreamsList1(){
	$("#iceCreams1").css('visibility','visible');
	$.get('/adminMenu/showIceCreamsList',function(data,status){
		for (let i=0; i< data.length; i++){
			var row = "<tr>"
					+"<td>" + data[i].name + "</td>"
					+"<td>" + data[i].flavor + "</td>"
					+"<td>" + data[i].quantity + "</td>"
					+"<td>" + data[i].price +"$</td>"
					+"<td><img style='width:130px'; src='" + data[i].photoURL + "'></td>"+
				"</tr>";
		$("#iceCreamsTable1").append(row);
		//console.log(row);
		}
	});
}

// 
function searchIceCreamsList2(){
	$("#iceCreams2").css('visibility','visible');
	$.get('/adminMenu/showIceCreamsList',function(data,status){
		let count = 0;
		str = window.location.search;
		if (typeof str === 'string'){
			var params = str.split("&");
			var iceCreamNameParams = params[1];
			var iceCreamNameSplit = iceCreamNameParams.split("=");
			var iceCreamName = iceCreamNameSplit[1];
			for (let i=0; i< data.length; i++){
				if (data[i].name === iceCreamName){
					var row = "<tr>"
					+"<td>" + data[i].name + "</td>"
					+"<td>" + data[i].flavor + "</td>"
					+"<td>" + data[i].quantity + "</td>"
					+"<td>" + data[i].price +"</td>" +
					"</tr>";
					$("#iceCreamsTable2").append(row);
					count++;
					//console.log(row);	
				}		
			}
			if (count === 0){
				var row = "<tr><td>Couldn't find anything</td></tr>"
				$("#iceCreamsTable2").append(row);

			}
		}
		
	});
}

function f(){
	var data = JSON.parse(localStorage.getItem("result"));
	console.log("data = " + data);
	$("#doc").text(data);
}
function redirectToIceCreamsMenu(){
	window.location.replace("/adminMenu/iceCreams");
}
function graph1(){
	const data = [];
	$.get('/adminMenu/showReservations',function(data1,status){
		for (let i=0; i<data.length; i++){
			data[i] = data1[i];
		}
	});
	
	const width = 900
	const height = 450
	const margin = { top: 50, bottom: 50, left: 50, right: 50 }

	const svg = d3
		.select("#d3-container")
		.append("svg")
		.attr("width", width - margin.left - margin.right)
		.attr("height", height - margin.top - margin.bottom)
		.attr("viewBox", [0, 0, width, height])

	const x = d3
		.scaleBand()
		.domain([0,100])
		.range([margin.left, width - margin.right])
		.padding(0.1)

	const y = d3
		.scaleLinear()
		.domain([0, 100])
		.range([height - margin.bottom, margin.top])

	svg
		.append("g")
		.attr("fill", "royalblue")
		.selectAll("rect")
		.data(data.sort((a, b) => d3.descending(a.score, b.score)))
		.join("rect")
		.attr("x", (d, i) => x(i))
		.attr("y", (d) => y(d.score))
		.attr("title", (d) => d.score)
		.attr("class", "rect")
		.attr("height", (d) => y(0) - y(d.score))
		.attr("width", x.bandwidth())

	function yAxis(g) {
		g.attr("transform", `translate(${margin.left}, 0)`)
			.call(d3.axisLeft(y).ticks(null, data.format))
			.attr("font-size", "20px")
	}

	function xAxis(g) {
		g.attr("transform", `translate(0,${height - margin.bottom})`)
			.call(d3.axisBottom(x).tickFormat((i) => data[i].name))
			.attr("font-size", "20px")
	}

	svg.append("g").call(xAxis)
	svg.append("g").call(yAxis)
	svg.node()
}