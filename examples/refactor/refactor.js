var a = null;

try {
	if (a.throw_an_error) {
		console.log("something is wrong with this compiler")
	}
} catch (e) {
	try {
		if (a.this_wont_work) {
			console.log("it doesnt even matter")
		} else {
			throw "error";
		}
	} catch (e) {
		try {
			console.log("All Good!")
		} catch (e) {}
	}
}