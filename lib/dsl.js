var Compiler = require("./parser.js")
var c = new Compiler();
var Pattern = Compiler.Pattern;
var scope = {};
c.addPattern("pattern {$pattern...} => {$transform...} ",function(){
    var transform = new Function("scope",`with(scope){${c.compile(this.transform)}}`).hold(scope);
    c.addPattern(this.pattern+"", transform);
    return "";
},{ name:"pattern", important: true });
c.addPattern("pattern $name:lit {$pattern...} => {$transform...} ",function(){
    var transform = new Function("scope",`with(scope){${c.compile(this.transform)}}`).hold(scope);
    c.addPattern(this.pattern+"", transform, { name: this.name+""});
    return "";
},{ name:"pattern", important: true });
c.addPattern("capture $name:lit {$pattern...} => {$transform...} ",function(){
    var transform = new Function("scope",`with(scope){${c.compile(this.transform)}}`).hold(scope);
    c.addPattern(this.pattern+"", transform, { name: this.name+"", capture: true });
    return "";
},{ name:"capture", important: true });
c.addPattern("{$body...}", function(){ return null }, { name:"brackets"});
c.addPattern("class $name:lit [ $var:brackets( , )... ]", function(){
    var p = c.addPattern(null, null, { name: this.name+"", captures: this.var.body.map(( pattern )=>{ return new Pattern(pattern) }) });
    return ""
}, { name: "pattern"});
c.addPattern("pattern $name:lit [ $var:brackets( , )... ] => {$rest...}", function(){
    var compiled = c.compile(this.rest);
    // console.log(compiled)
    var trans  = new Function("scope",`with(scope){${compiled}}`).hold(scope);
    var p = c.addPattern(null, trans, { name: this.name+"", captures: this.var.body.map(( pattern )=>{ return new Pattern(pattern) }) });
    return ""
}, { name: "pattern"});

c.addPattern("({$body...})", function(){
    var pattern = c.addPattern("var $name:lit",function(){ return "scope."+this.name })
    var body = "with(scope){"+c.compile(this.body)+"}";
    c.patterns.pop();
    var fn = new Function("scope",body);
    fn(scope);
    return "";
})
c.addPattern("",function(){
    var tokens = Pattern.tokenize(this+"");
    // console.log(tokens);
    var str = tokens.map((v,i)=>{
        var last = tokens[i-1] && tokens[i-1].passthrough || tokens[i-1];
        var next = tokens[i+1] && tokens[i+1].putthrough || tokens[i+1];
        if(i==0 && v.type !== "var"){

        }
        if(v.type == "var"){
            return `$\{this.${v.var}\}`
        }
        return v.value;
    }).join("").replace(/^[\{\$]\{|\}(\})?$/g,"`");
    // console.log(str);
    return str;
},{ name:"pattern_expression", captures:[
    new Pattern("{ {$body...} }")
] })
module.exports = c;
