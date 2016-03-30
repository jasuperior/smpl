function go_get_data() {
	return new Promise(function (resolve, reject) {
		return $.fetch("./somewhere.js").then(function (something) {
			var a = something.replace("some words", "nothing");

			return do_operation(a).then(function (long_operation) {
				resolve(long_operation)
			})
		})
	})
}