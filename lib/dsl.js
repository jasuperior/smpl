var Compiler = require("./parser.js")
var c = new Compiler();
var Pattern = Compiler.Pattern;
var scope = {
    compiler: c,
    Pattern: c.addPattern.bind(c),
    compile: c.compile.bind(c),
    prepend: c.prepend.bind(c),
    append: c.append.bind(c),
    unpend: c.unpend.bind(c)
};
c.addPattern("pattern {$pattern...} => {$transform...} ",function(){
    // console.log(`with(scope){with(this){${this.transform}}}`)
    var transform = new Function("scope",`with(scope){with(this){${this.transform}}}`).hold(scope); //may need to take the c.compile off of every pattern type and create a special bound/recursive versin of the pattern that uses it.
    c.addPattern(this.pattern+"", transform);
    return "";
},{ name:"pattern", important: true });
c.addPattern("pattern $priority:num {$pattern...} => {$transform...} ",function(){
    // console.log(`with(scope){with(this){${this.transform}}}`)
    var transform = new Function("scope",`with(scope){with(this){${this.transform}}}`).hold(scope); //may need to take the c.compile off of every pattern type and create a special bound/recursive versin of the pattern that uses it.
    c.addPattern(this.pattern+"", transform, { priority: this.priority });
    return "";
},{ name:"pattern", important: true });
c.addPattern("pattern $name:lit {$pattern...} => {$transform...} ",function(){
    var transform = new Function("scope",`with(scope){with(this){${this.transform}}}`).hold(scope);
    c.addPattern(this.pattern+"", transform, { name: this.name+""});
    return "";
},{ name:"pattern", important: true });
c.addPattern("pattern $priority:num $name:lit {$pattern...} => {$transform...} ",function(){
    var transform = new Function("scope",`with(scope){with(this){${this.transform}}}`).hold(scope);
    c.addPattern(this.pattern+"", transform, { name: this.name+"", priority: this.priority });
    return "";
},{ name:"pattern", important: true });
c.addPattern("capture $name:lit {$pattern...} => {$transform...} ",function(){
    var transform = new Function("scope",`with(scope){with(this){${this.transform}}}`).hold(scope);
    c.addPattern(this.pattern+"", transform, { name: this.name+"", capture: true });
    return "";
},{ name:"capture", important: true });
c.addPattern("capture $priority:num $name:lit {$pattern...} => {$transform...} ",function(){
    var transform = new Function("scope",`with(scope){with(this){${this.transform}}}`).hold(scope);
    c.addPattern(this.pattern+"", transform, { name: this.name+"", capture: true, priority: this.priority });
    return "";
},{ name:"capture", important: true });

c.addPattern("{$body...}", null, { name:"brackets"});
c.addPattern("class $name:lit [ $patterns:brackets( , )... ]", function(){
    // console.log(this);
    var p = c.addPattern(null, null, { name: this.name+"", captures: !Array.isArray(this.patterns.body)?
    [new Pattern(this.patterns.body, null, {compiler: c })] :
                this.patterns.body.map(( pattern )=>{
                    // console.log(pattern);
                    return new Pattern(pattern, null, { compiler: c}) })
                });
    // console.log(p);
    return ""
}, { name: "pattern"});
c.addPattern("class $name:lit $patterns:brackets", function(){
    // console.log(this);
    var p = c.addPattern(null, null, { name: this.name+"", captures:  [new Pattern(this.patterns.body, null, {compiler: c })]  });
    // console.log(p);
    return ""
}, { name: "pattern"});
var p = c.addPattern("pattern $name:lit [ $var:brackets( , )... ] => {$rest...}", function(){
    // var compiled = c.compile(this.rest);
    console.log(this.name);
    var trans  = new Function("scope",`with(scope){with(this){${this.rest}}}`).hold(scope);
    var p = c.addPattern(null, trans, { name: this.name+"", captures: this.var.body.map(( pattern )=>{ return new Pattern(pattern) }) });
    // console.log(p.getPattern())
    return ""
}, { name: "pattern"});
c.addPattern("capture $name:lit [ $var:brackets( , )... ] => {$rest...}", function(){
   // var compiled = c.compile(this.rest);
   var trans  = new Function("scope",`with(scope){with(this){${this.rest}}}`).hold(scope);
   var p = c.addPattern(null, trans, { name: this.name+"", capture: true, captures: this.var.body.map(( pattern )=>{ return new Pattern(pattern) }) });
   // console.log(p.getPattern())
   return ""
}, { name: "pattern"});
c.addPattern("---$body...---", function(){
    var pattern = c.addPattern("ctx $name:lit",function(){ return "scope."+this.name })
    var body = "with(scope){"+c.compile(this.body)+"}";
    c.patterns.pop();
    // console.log(body);
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
c.persist();
module.exports = c;
