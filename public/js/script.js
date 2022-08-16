const isAuth = require('../../middleware/is-auth');
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
	$.get('showData',function(data,status){
		for (let i=0; i< data.length; i++){
			var row = "<tr><td>" + data[i].fullname + "</td><td>" + data[i].email + "</td><td>" + data[i].admin + "</td></tr>";
			$("#userstable").append(row);
		}
	});
}
function showIceCreamsList(){
	$("#iceCreams").css('visibility','visible');
	$.get('showIceCreamsList',function(data,status){
		for (let i=0; i< data.length; i++){
			var row = "<tr><td>" + data[i].name + "</td><td>" + data[i].flavor + "</td><td>" + data[i].quantity + 
			"</td><td>" + data[i].price +"</td></tr>";
			$("#iceCreamsTable").append(row);
		}
	});
}
function redirectToIceCreamsMenu(){
	window.location.replace("/adminMenu/iceCreams");
}
function showIceCreams(){
	$("#iceCreams").css('visibility','visible');
}
