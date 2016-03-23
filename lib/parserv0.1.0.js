var Reg = require("named-js-regexp");
var Source = require("./helpers/Source");
const patterns = [];
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function inputString (str, input, index){
    return str.slice(0,index)+input+str.slice(index, str.length);
}
if(!RegExp.prototype.toSource){
    RegExp.prototype.toSource = function toSource () {
        return escapeRegExp(this.source);
    }
    RegExp.prototype.startsWith = function startsWith () {
        var source = this.source; var result =  "^"+source;
        return new RegExp(result);
    }
    RegExp.prototype.escape = function escape () {
        return this.source.replace(/[\/\\]/g,"\\$&")
    }
}
var Pattern = (function(){
    const tokens = {
        str: /(\"(\\.|[^"])*\")|(\'(\\.|[^'])*\')/,
        comment: /\/\*(.|\s)*\*\/|\/\/.*[\n\r]/,
        vartype: /(\$\w+)\s*:\s*(\w+)/,
        var: /\$\w[\w0-9]+/,
        lit: /\b[A-z]\w*/,
        num:/[0-9]+/,
        whitespace: /\s+/,
        repeat: /\(((.*?))\)\s*\.\.\./,
        punc: /[.!,:;]/,
        op: /===|==|!==|!=|>=|<=|[><\/\+\-\*\&\|=]/,
        pattern_group: /\$\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/,
        delims: /[\[\]\(\)\{\}]/,
        nonWord:/\W/,
        wildcard:/./

    };
    const ANY = /(.|\n|\r)*?/;
    function tokenize ( value ) {
        //turns string input int array of tokens
        var types = Object.keys(tokens), pattern = [], index = 0, groupcount = 0;
        for(var i = 0; i < types.length; i++ ){
            var key = types[i], type = tokens[key];
            // console.log(type.startsWith(), `"${value}"`)
            var result = type.startsWith().exec(value);
            if(result){
                // console.log(value)
                var input = { type: key, value: result[0], reg_pattern: type };
                if(key == "repeat"){
                    var str = result[0];
                    var delim = str.match(type)[1];
                    input.delim = delim, input.repeat = true, input.reg_pattern = ANY;
                    var last = pattern[pattern.length-1];
                    if(last.type == "vartype" || last.type == "pattern_group"){
                        last.delim = delim;
                        last.repeat = true;
                    }else pattern.push(input)
                }
                else if(key == "vartype"){
                    var str = result[0];
                    var match = str.match(type);
                    input.var = match[1].slice(1,match[1].length);
                    input.token = match[2]; //the key to the token which
                    pattern.push(input);
                }
                else if(key == "pattern_group"){
                    input.value = result[0].slice(2,result[0].length-1);
                    input.pattern = new Pattern(input.value);
                    input.index = groupcount++;
                    pattern.push(input);
                }
                else pattern.push(input);
                index = result.index + result[0].length;
                value = value.slice(index, value.length);
                i=0;
            }
        }
        if(value.length) return false;
        return pattern;
    }

//used to
    function Pattern ( pattern, trans_fn, options ) {
        this.tokens = tokenize(pattern); //get tokens for use in pattern
        if(!this.tokens) return false;
        var vars = this.tokens.map((token)=>{
            if(token.type == "vartype")
                return token.var;
            if(token.type == "pattern_group" && options) token.pattern.compiler = options.compiler
        }).filter((v)=>{ return v});
        if(vars.length) this.vars = vars;
        if(options){
            this.important = options.important; //will not delete between parses
            this.backtrack = options.backtrack; //will not advance cursor
            this.compiler = options.compiler;
            this.name = options.key || options.name; //makes it callable in other patterns
            if(options.capture){
                this.captures = []; //an array of patterns
            }
            this.options = options;
        }
        this.transform = trans_fn;
    }
    Pattern.prototype.getPatternString = function getPatternString ( context ) {
        //returns a String that can be given to the compiler to match against.
        var compiler = this.compiler||context||{getPattern:()=>{return false}}, groupcount = 0;
        if(!compiler) return false;

        var parts = this.tokens.map((token)=>{
            var result="";
            if(token.type == "vartype"){
                var input;
                if(input = tokens[token.token] || compiler.getPattern(token.token) ){
                    result+="(?<"
                    result+=token.var+">";
                    var pattern = input instanceof Pattern? input.getPattern(compiler).source: input.source;
                    if(input.captures && input.captures.length ){
                        pattern = input.captures.map((v)=>{ return "("+v.getPatternString()+")" }).join("|");
                    }
                    result+="(("+pattern+"))";
                    if(token.repeat){
                        result=inputString(result, `\\s*`+escapeRegExp(token.delim)+`\\s*`, result.length-1)
                        result+=`+`
                        result+=pattern;
                    }
                    result += ")"
                }else {
                    throw new Error("Pattern is not defined")
                }
            }else if ( token.type == "pattern_group"){
                var new_pattern = new Pattern(token.value, null, { compiler: compiler });
                var pattern =  new_pattern.getPattern(compiler).source;
                // console.log(new_pattern.tokens)
                result += "(?<"
                result += `group${groupcount++}>`;
                result += "("+pattern+")";

                if(token.repeat){
                    result=inputString(result, `\\s*`+escapeRegExp(token.delim)+`\\s*`, result.length-1)
                    result+=`+`
                    result+=pattern;
                }
                result += ")";
                // console.log(result)
                return result;
            }else if ( token.type == "repeat"){
                result += ANY.source
            }else if (token.type == "whitespace"){
                result += `\\s*`//may have to change to "+"
            }else {
                result += token.value;
            }
            return result;
        });
        // console.log(parts.join(""))
        return parts.join("");
    }
    Pattern.prototype.getPattern = function getPattern ( compiler ) {
        return Reg(this.getPatternString(compiler))
    }
    Pattern.prototype.getCallPattern = function getCallPattern ( context ) {
        //returns a String that can be given to the compiler to match against.
        var compiler = this.compiler||context;
        if(!compiler) return false;

        var parts = this.tokens.map((token)=>{
            var result="";
        })
    }
    Pattern.prototype.capture = function capture ( value , index /*optional*/) {
        var pattern = new Pattern( value, null, this.options );
        if(!this.captures) this.captures = [];
        if(!index && index !== 0 ) this.captures.push(pattern);
        else {
                if(this.captures.length < index ) this.captures.push(pattern);
                else{
                var l = this.captures.slice(0,index), r = this.captures.slice(index, this.captures.length);
                var result = l.concat(pattern, r);
                this.captures = result;
            }
        }
        return pattern;
    }
    Pattern.prototype.match = function match ( string ) {
        var pattern = this.getPattern(), obj = pattern.execGroups(string); value = pattern.exec(string);
        if(!obj && value){
            obj = value;
        }
        obj._value = value[0];
        obj._start = value.index;
        obj._end = obj._start+obj._value.length;
        obj._transform = this.transform;
        // obj.captures = pattern.captures;
        // console.log("we are matching:::", string, "::::", obj)
        if(!obj) return obj;
        return new returnPattern( obj, this.tokens, this.compiler, this );
    }
    Pattern.prototype.convert = function convert ( ) {
        if(!this.transform) return false;

    }
    Pattern.tokens = tokens;
    Pattern.tokenize = tokenize;
    return Pattern;
}())
var returnPattern = (function(){
    function handle ( token, value, pattern, compiler, obj, groups) {
        if(token.repeat){
            var reg = pattern.getPattern? pattern.getPattern(compiler):pattern, source = reg && reg.source;
            source = source + "\\s*"+token.delim+"\\s*";
            // console.log("source::::::::::::::",source);
            var new_reg = new RegExp(source,"g");
            values = value.replace(new_reg, "$&%%%%%%%").split(new RegExp(token.delim+"\\s*%%%%%%%")).map((value)=>{
                if(!pattern.getPattern){
                    // console.log("no get pattern", reg);
                    return { //can probably replace this with new instance of return token;
                         _value: value.trim(),
                         toString: function toString() {
                             return this._value;
                         },
                         valueOf: function valueof () {
                             return this._value;
                         }
                      }
                  }
                  return pattern.match(value);
            });
        }else values = [pattern.match? pattern.match(value) : { //can probably replace this with new instance of return token;
                 _value: value.trim(),
                 toString: function toString() {
                     return this._value;
                 },
                 valueOf: function valueof () {
                     return this._value;
                 }
              }
          ];
        if(pattern.transform) values.T = values.transformPattern =  function transform () {
            return this.map(( str , i)=>{
                if(str.transformPattern) return str.transformPattern();
                return str;
            }).filter((v)=>{ return v }).join(token.delim);
        };
         if(pattern.vars){//TODO: Must make pattern have a var property to patterns, so that i can use the keys to look up the props in obj;
             var var_obj = values;
             if(groups) obj.groups[token.index] = var_obj; else obj[token.var] = var_obj;
             values.length > 1 && pattern.vars.forEach((v)=>{ var_obj[v] = []; });
             values.forEach((value)=>{
                 var sub_obj = pattern.match(value._value);//TODO:: must define this. must have value parameter which is the sliced string.
                 pattern.vars.forEach(function(v){
                     var_obj[v]?
                     var_obj[v].push(sub_obj[v]):
                     (var_obj[v] = sub_obj[v]); //May cause problems. take a look. we are setting the value fo the sub match to the
                 });
             })

         }else{
             values = values.length <= 1 ? values[0]:values;
             if(groups)
              obj.groups[token.index] = values;
             else
              obj[token.var] =  values;
         }
    }
    function returnPattern ( match, tokens, compiler, pattern ) {
        var obj = this;
        this._value = match._value;
        this._start = match._start; this._end = match._end;
        this.transformPattern = this.T = function transform () {
            var fn =  pattern && pattern.transform;
            console.log("we are transformaing", pattern)
            if(fn){
                return fn.call(this)
            }
         };
        this.captures = pattern && pattern.captures;
        this.addCapture = this.C = this.captures && pattern.capture;
        this.toString = this.valueOf = function toString (){
            return Array.isArray(this._value)&&this._value.length<=1?this._value[0]:this._value.toString();
        }
        tokens.forEach(function(token){
            var pattern, value = match[token.var];
            if( token.type == "vartype"){
                // console.log("our token:::::::::", token)
                var values, pattern = compiler.getPattern(token.token)||Pattern.tokens[token.token]; //TODO: make it return;
                handle(token, value, pattern,  compiler, obj)
            }
            if( token.type == "pattern_group"){
                var value = match["group"+token.index]
                var values, pattern = token.pattern; //TODO: make it return;
                obj.groups = obj.G = obj.groups || []
                handle(token, value, pattern, compiler, obj, true)
            }
        });
    }
    return returnPattern;
}())
var Compiler = (function () {
    function Compiler () {
        this.patterns = []
    }
    Compiler.prototype.compile = function compile () {}
    Compiler.prototype.addPattern = function addPattern ( pattern, fn, options ) {
        options = options || {};
        if(!options.compiler) options.compiler = this;
        var new_pattern = new Pattern(pattern, fn, options);
        this.patterns.push(new_pattern);
        return new_pattern;
    }
    Compiler.prototype.getPattern = function getPattern( identifier ) {
        if(typeof identifier == "number") return this.patterns[identifier];
        return this.patterns.find((pattern)=>{ return pattern.name == identifier })
    }
    return Compiler;
}());
var c = new Compiler();
c.addPattern("little $person:lit", null, { name: "example" })
var a = c.addPattern("hello $( $place:example )(,)...", function(){
    console.log(this.G[0].place);
    return this+""
}), b;
// console.log(a)
b = a.getPattern()
// console.log(b.exec("hello wussup, guy, laafyu"))
console.log(a.match("nothing better hello little girl, little boy, little person;").G[0].place )
module.exports = Pattern;
