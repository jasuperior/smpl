//notice that whitespace as a delim is marked by an empty paren
hello([
	world,
	moon,
	sun
])  //compiles to hello([ world, moon, sun ]);
hello([
	world
])  //should compiler to hello([world])
hello([
	world,
	moon
])  //should compiler to hello([world])