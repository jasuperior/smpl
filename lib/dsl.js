var Parser = require("./parser.js")
compiler = new Parser();

//**************** Bang Patterns :: Backtracks
compiler.addPattern("!pattern $input:group => $output:group", function(){
    var reg = compiler.types.group.source;
    reg = new RegExp(reg, "g");
    var extracted = this.match(reg);
    var input = extracted[0], output = extracted[1];
    input = input.substr(1, input.length-2).trim();
    output = output.substr(1, output.length-2).trim();
    compiler.addPattern(input, output,null,true); //backtracked
    return "";
}, true);
compiler.addPattern("!pattern $name:lit $input:group => $output:group", function(){
    var reg = compiler.types.group.source;
    reg = new RegExp(reg, "g");
    var extracted = this.match(reg), name = this.match(/pattern\s+([A-z0-9]+)/)[1];
    var input = extracted[0], output = extracted[1];
    input = input.substr(1, input.length-2).trim();
    output = output.substr(1, output.length-2).trim();
    // console.log(name);
    compiler.addType(name, input, output, true); //backtracked
    return "";
}, true);
compiler.addPattern("!patterns $name:lit $conditions:group", function(){
        var afuncs = compiler.types.afunc.source, parens = compiler.types.paren, curly = compiler.types.curly, lit = compiler.types.lit,
        rules = [], exprs = [];
        afuncs = new RegExp(afuncs, "g");
        var patterns = this.match(afuncs);
        var name = this.replace("patterns ","").match(lit)[0];
        patterns = patterns.map((pattern)=>{
            var rule = pattern.match(parens)[0], exp =pattern.match(curly)[0];
            rule = rule.substr(1, rule.length-2); exp = exp.substr(1, exp.length-2);
            rules.push(rule);  exprs.push(exp);
            compiler.addPattern( rule, exp)
            return { rule: rule, expression: exp };
        });
        compiler.makeType(name, rules, exprs, true);
        return "";
}, true)
//**************** Normal Patterns
compiler.addPattern("pattern $input:group => $output:group", function(){
    var reg = compiler.types.group.source;
    reg = new RegExp(reg, "g");
    var extracted = this.match(reg);
    var input = extracted[0], output = extracted[1];
    input = input.substr(1, input.length-2).trim();
    output = output.substr(1, output.length-2).trim();
    compiler.addPattern(input, output);
    return "";
}, true);
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
}, true);
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
}, true);
compiler.addPattern("patterns $name:lit $conditions:group", function(){
        var afuncs = compiler.types.afunc.source, parens = compiler.types.paren, curly = compiler.types.curly, lit = compiler.types.lit,
        rules = [], exprs = [];
        afuncs = new RegExp(afuncs, "g");
        var patterns = this.match(afuncs);
        var name = this.replace("patterns ","").match(lit)[0];
        patterns = patterns.map((pattern)=>{
            var rule = pattern.match(parens)[0], exp =pattern.match(curly)[0];
            rule = rule.substr(1, rule.length-2); exp = exp.substr(1, exp.length-2);
            rules.push(rule);  exprs.push(exp);
            compiler.addPattern( rule, exp)
            return { rule: rule, expression: exp };
        });
        compiler.makeType(name, rules, exprs );
        return "";
}, true)
// console.log(compiler.patterns[3].rule.toRegExp())
module.exports = compiler;
