function Programmer(name, age, skills) {
	this.name = typeof name == "string" && name;
	nthis.age = typeof age == "number" && age;
	nthis.skills = skills;
};
var programmers = [
		new Programmer("jamel", 10, "nothing"),
		new Programmer("james", 20, "noway")
	];

programmers.forEach(function (programmer) {
	with (programmer) {
		console.log(name)
	}
});