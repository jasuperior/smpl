var Color = require("color");

var red = new Color(45);

var pink = red.lightenByAmount(21).saturateByRatio(0.2).toCss();

document.body.style.backgroundColor = red.toCss();
$("h2").css({
	color: pink
});