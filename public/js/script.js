// const isAuth = require('../../middleware/is-auth');
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

function check(){
	$.get('cartSessionParams',function(data,status){
		$.each(data, function(key,val) {
			console.log(data);
			$("#text1").text("Hello " + data[key]);
		}
		)});
}

/* Share Links */

/*
Whatsapp:
https://api.whatsapp.com/send?text=[post-title] [post-url]
Twitter:
https://twitter.com/share?url=[post-url]&text=[post-title]
Facebook:
https://www.facebook.com/sharer.php?u=[post-url]
*/

const facebookBtn = document.querySelector(".facebook-btn");
const twitterBtn = document.querySelector(".twitter-btn");
const whatsappBtn = document.querySelector(".whatsapp-btn");


function shareLink() {
	let postUrl = encodeURI(document.location.href);
	let postTitle = encodeURI("Hey, Check out this awesome new ice-cream shop: ");

	facebookBtn.setAttribute("href",
	'https://www.facebook.com/sharer.php?u='+postUrl)

	twitterBtn.setAttribute("href",
	'https://twitter.com/share?url='+postUrl+'&text='+postTitle)

	whatsappBtn.setAttribute("href",
	'https://api.whatsapp.com/send?text='+postTitle+''+postUrl)
}

shareLink();
