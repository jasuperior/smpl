var Parser = require("./parser.js")
compiler = new Parser();
compiler.addPattern("pattern $input:group => $output:group", function(){
    var reg = compiler.types.group.source;
    reg = new RegExp(reg, "g");
    var extracted = this.match(reg);
    var input = extracted[0], output = extracted[1];
    input = input.substr(1, input.length-2).trim();
    output = output.substr(1, output.length-2).trim();
    compiler.addPattern(input, output);
    return "";
});
compiler.addPattern("pattern $name:lit $input:group => $output:group", function(){
    var reg = compiler.types.group.source;
    reg = new RegExp(reg, "g");
    var extracted = this.match(reg), name = this.match(/pattern\s+([A-z0-9]+)/)[1];
    var input = extracted[0], output = extracted[1];
    input = input.substr(1, input.length-2).trim();
    output = output.substr(1, output.length-2).trim();
    // console.log(name);
    compiler.addType(name, input, output);
    return "";
});
compiler.addPattern("capture $name:lit $input:group => $output:group", function(){
    var reg = compiler.types.group.source;
    reg = new RegExp(reg, "g");
    var extracted = this.match(reg), name = this.match(/capture\s+([A-z0-9]+)/)[1];
    var input = extracted[0], output = extracted[1];
    input = input.substr(1, input.length-2).trim();
    output = output.substr(1, output.length-2).trim();
    // console.log(name);
    compiler.addCapture(name, input, output);
    return "";
});
console.log(compiler.compile(`
pattern jamel (nothing special) => { your mom }
capture variable ( var $name:lit ) => { $name }
pattern ( hello $name:variable ) => {
    welcome($name)
}
var jamel = 10;
hello jamel;
`))
