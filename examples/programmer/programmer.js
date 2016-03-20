function Programmer(name, age, skills) {
	this.name = name;
	this.age = age;
	this.skills = skills;
}

var createProgrammer = (function () {
		function create(args) {
			return Programmer.apply(this, args)
		}

		create.prototype = Programmer.prototype;

		return function () {
			return new create(arguments)
		}
	})();

var programers = [
		createProgrammer.apply(null, [
			"jamel",
			10,
			"nothing"
		]),
		createProgrammer.apply(null, [
			"james",
			20,
			"noway"
		])
	];

programmers.forEach((Programmer) = > {
	console
});.if(skillset, exists) {
	return log(name)
};