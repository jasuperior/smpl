var Reg = require("smpl-named-js-regexp");
var Source = require("./helpers/Source");
var pretty = require("pretty-js");
const patterns = [];
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function inputString (str, input, index){
    return str.slice(0,index)+input+str.slice(index, str.length);
}
function truncateString (string, left) {
    if(left) return  "..." + string.slice(Math.max(0,string.length-25),string.length)
    return string.slice(0,Math.min(25,string.length))+"...";
}
function ungroup ( input, l, r ) {
    var left = input[0], right = input[input.length-1], lreg = /[\[\{\(]/, rreg=/[\}\]\)]/, rmatch, lmatch;
    if(left && right && (lmatch = left.match(l||lreg)) && (rmatch = right.match(r||rreg) )){
        input = input.slice(1,input.length-1);
        // console.log(input[0],"::::", input[input.length-1])
        if(input[0].match(lreg) && input[input.length-1].match(rreg))
            return ungroup(input, rmatch, lmatch);
    }
    return input;
}
Function.prototype.hold = function hold () {
    var self = this;
    var args = [].slice.call(arguments);
    return function () {
        return self.apply(this, args);
    }
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
if(!Array.prototype.includes){
    Array.prototype.includes = function (value) {
        return this.indexOf(value) > -1;
    }
}
var Pattern = (function(){
    const tokens = {
        str: /(\"(\\.|[^"])*\")|(\'(\\.|[^'])*\')/,
        comment: /\/\*(.|\s)*\*\/|\/\/.*[\n\r]/,
        vartype: /(\$\w+)\s*:\s*((\$)?\w+)/,
        var: /\$(\w[\w0-9]+)/,
        lit: /\b[A-z]\w*/,
        num:/(-|\+)?[0-9]+/,
        flo:/(-|\+)?[0-9]+(\.[0-9]+)?/,
        whitespace: /\s+/,
        repeat: /\(((.*?))\)\s*\.\.\./,
        ellipses: /\.\.\./,
        punc: /[.!,:;]/,
        pattern_group: /\$\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/,
        delims: /[\[\]\(\)\{\}]/,
        op: /==>|=>|===|==|!==|!=|>=|<=|[><\/\+\-\*\&\|=]/,
        nonWord:/\W/,
        wildcard:/./
    };
    const delims = {
        "(": /\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/,
        "{": /\{((?:(?:(?![}{]+?)[^}{])*)|(?:[^}{]+?|\{(?:[^}{]+?|\{(?:[^}{]+?|\{(?:[^}{]+?|\{(?:[^}{]+?|\{(?:[^}{]+?|\{(?:[^}{]+?|\{(?:[^}{]+?|\{(?:[^}{]+?|\{(?:[^}{]+?|\{(?:[^}{]+?|\{[^}{]*?\})*?\})*?\})*?\})*?\})*?\})*?\})*?\})*?\})*?\})*?\})*?)\}/, //12 levels of nesting
        "_{":/\{.*?\}/,
        "[": /\[(?:[^\]\[]+|\[(?:[^\]\[]+|\[[^\]\[]*\])*\])*\]/
    };
    Object.keys(delims).forEach((v)=>{
        delims[v].isDelim = true;
    })
    const alt = {
        "(":")",
        "{":"}",
        "[":"]"
    };
    const ends = [")","}","]"];
    const ANY = /(.|\n|\r)*?/;
    function tokenize ( value ) {
        //turns string input int array of tokens
        var types = Object.keys(tokens), pattern = [], index = 0, groupcount = 0;
        for(var i = 0; i < types.length; i++ ){
            var key = types[i], type = tokens[key];
            // console.log(type.startsWith(), `"${value}"`)
            var result = type.startsWith().exec(value);
            if(result){
                var input = { type: key, value: result[0], reg_pattern: type, raw:result[0] };
                var last = pattern[pattern.length-1];
                // console.log(last)
                if(last && last.type == "whitespace"){
                    // console.log("white space")
                     last.putthrough = input;
                 }
                if(key == "repeat"){
                    var str = result[0];
                    var delim = str.match(type)[1].trim();
                    // console.log(delim.length, delim)
                    input.delim = delim, input.repeat = true, input.reg_pattern = ANY;
                    var last = pattern[pattern.length-1];
                    if(last.type == "vartype" || last.type == "pattern_group"){
                        last.delim = delim;
                        last.repeat = true;
                    }
                }
                else if(key == "vartype"){
                    var str = result[0];
                    var match = str.match(type);
                    // console.log(match);
                    input.var = match[1].slice(1,match[1].length);
                    input.token = match[2]; //the key to the token which
                    input.capture = !!match[3];
                    pattern.push(input);
                }
                else if(key == "pattern_group"){
                    input.value = result[0].slice(2,result[0].length-1);
                    input.pattern = new Pattern(input.value);
                    input.index = groupcount++;
                    pattern.push(input);
                }
                else if ( key == "var" ){
                    var match = result[0].match(tokens.var);
                    input.var = match[1];
                    pattern.push(input);
                }
                else if ( key == "ellipses" ){
                    input.type = "repeat"
                    var last = pattern[pattern.length-1];
                    if(last.type=="var"){
                        pattern.pop();
                        input.var = last.var;
                        last =  pattern[pattern.length-1]; //extend this to account for white space
                        if(last.type == "delims" && delims[last.value]){
                            pattern.pop();
                            input.reg_pattern = delims[last.value];
                            input.alt = alt[last.value];
                            input.series = delims["_"+last.value];
                        }else{
                            input.reg_pattern = ANY;
                        }
                    }else {
                        // console.log("not::")
                        if(last.type == "delims" && delims[last.value]){
                            pattern.pop();
                            input.reg_pattern = delims[last.value];
                            input.alt = alt[last.value];
                        }else{
                            input.reg_pattern = ANY;
                        }
                    }
                    pattern.push(input)
                }
                else if (key == "delims") {
                    var last =  pattern[pattern.length-1];
                    if( last && last.type == "repeat" && last.alt  == input.value){

                    }else
                        pattern.push(input);
                }
                else if (key == "whitespace") {
                    input.passthrough = pattern[pattern.length-1];
                    // input.putthrough = pattern[pattern.length-1];
                    pattern.push(input);
                }
                else if (key == "punc") {
                    input.value = "\\"+input.value;
                    pattern.push(input);
                }
                else{
                    pattern.push(input);
                }
                index = result.index + result[0].length;
                value = value.slice(index, value.length);
                i=0;
            }
        }
        if(value.length) return false;
        // console.log("pattt::::::::::::",pattern);
        return pattern;
    }

//used to
    function Pattern ( pattern, trans_fn, options ) {
        if(pattern) pattern+=""; else pattern = "";
        this.value = pattern;
        this.tokens = tokenize(pattern); //get tokens for use in pattern
        if(!this.tokens) return false;
        var vars = this.tokens.map((token)=>{
            if(token.type == "vartype")
                return token.var;
            if(token.type == "repeat" && token.var )
                    return token.var;
            if(token.type == "pattern_group" && options) token.pattern.compiler = options.compiler
        }).filter((v)=>{ return v});
        if(vars.length) this.vars = vars;
        if(options){
            this.important = options.important; //will not delete between parses
            this.backtrack = options.backtrack; //will not advance cursor
            this.compiler = options.compiler;
            this.name = options.key || options.name; //makes it callable in other patterns
            if(options.captures){
                this.captures = options.captures; //an array of patterns
            }
            if(options.capture && this.compiler && this.name ){
                this.compiler.addPattern("",null,{ captures: [], name: `$${this.name}` })
            }
            this.options = options;
        }
        this.transform = trans_fn;
    }
    Pattern.prototype.getPatternString = function getPatternString ( context, start ) {
        //returns a String that can be given to the compiler to match against.
        if(this.captures && this.captures.length) return this.getCaptureString(context, start);
        var compiler = this.compiler||context||{getPattern:()=>{return false}}, groupcount = 0;
        if(!compiler) return false;

        var parts = this.tokens.map((token,i)=>{
            var result="";
            if(token.type == "vartype"){
                var input;
                if(input = tokens[token.token] || compiler.getPattern(token.token) ){
                    result+="(?<"
                    result+=token.var+">";
                    var pattern = input instanceof Pattern? input.getPatternString(): input.source;
                    if( token.capture && input.captures && input.captures.length ){
                        pattern = input.captures.map((v)=>{ return "("+v.getPatternString()+")" }).join("|");
                    }

                    var inputstr = "(("+(pattern)+"))";
                    if(token.repeat){
                        if(token.token == "brackets")
                            inputstr = `((${delims["_{"].source}))`; //temporary fix for nested bracket bug until we use custom regex
                        inputstr=inputString(inputstr, `\\s*`+escapeRegExp(token.delim)+`\\s*`, inputstr.length-(1))
                        inputstr+=`*`
                        inputstr+=`(${pattern})`;
                        // console.log(inputstr)
                    }else{
                        inputstr = inputstr.slice(1,inputstr.length-1);
                        // console.log(inputstr)
                    }
                    result += inputstr + ")"
                }else {
                    throw new Error(`Pattern [${token.token}] is not defined`)
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
                    result+=`*`
                    result+=pattern;
                }
                result += ")";
                // console.log(result)
                return result;
            }else if ( token.type == "repeat"){
                var next = this.tokens[i+1]||{};
                var white = next.type == "whitespace", greedy;
                if(white){
                    next = this.tokens[i+2]||{};
                    greedy = !next.type&&!token.alt;
                    //if(greedy) console.log(token) //make sure this works. may fuck up some cases
                }
                if( token.var ){
                    result += `(?<${token.var}>${greedy?"(.|\\n|\\r)*":token.reg_pattern.source})`;
                }else result += token.reg_pattern.source
                // console.log(token.value, result);
            }else if (token.type == "whitespace"){
                result += `\\s*`//may have to change to "+"
            }else if (token.type == "delims") {
                result += "\\"+token.value;

            }
            else {
                result += token.value;
            }
            return result;
        });
        // console.log(parts.join(""))
        return (start?"^":"")+parts.join("");
    }
    Pattern.prototype.getPattern = function getPattern ( compiler ) {
        return Reg(this.getPatternString(compiler||this.compiler))
    }
    Pattern.prototype.getPatternStart = function getPatternStart ( compiler ) {
        return Reg(this.getPatternString(compiler||this.compiler, true))
    }
    Pattern.prototype.getCaptureString = function getCaptureString ( context, start ) {
        // console.log("getting", this)
        //returns a String that can be given to the compiler to match against.
        var compiler = this.compiler||context;
        if(!compiler||!this.captures||!this.captures.length) return null;

        var str = this.captures.map((pattern)=>{
            // console.log(pattern)
            var result = "("+pattern.getPatternString( compiler )+")";
            // console.log(result)
            return result;
        }).join("|");
        return (start?"^":"")+str;
    }
    Pattern.prototype.getCapture = function getCapture ( context ) {
        return Reg(this.getCaptureString(context||this.compiler));
    }
    Pattern.prototype.capture = function capture ( value , index /*optional*/) {
        // console.log(this)
        var pattern = new Pattern( value, null, this.options );
        var capture =  (this.compiler||this.pattern.compiler).getPattern("$"+(!this.pattern? this.name: this.pattern.name));
        if(!capture) capture = (this.compiler||this.pattern.compiler).addPattern("",null,{
            captures: [],
            name: "$"+(!this.pattern? this.name: this.pattern.name)
        });
        if(pattern.vars) {
            if(!capture.vars) capture.vars = [];
            pattern.vars.forEach((v)=>{
                // console.log(v)
                capture.vars.includes(v)?false:capture.vars.push(v);
            })
        }
        if(!index && index !== 0 ) capture.captures.push(pattern);
        else {
                if(capture.captures.length < index ) capture.captures.push(pattern);
                else{
                var l = capture.captures.slice(0,index), r = capture.captures.slice(index, capture.captures.length);
                var result = l.concat(pattern, r);
                capture.captures = result;
            }
        }
        // console.log(capture.captures[0])
        return pattern;
    }
    Pattern.prototype.match = function match ( string, start ) {
        var pattern = start? this.getPatternStart(): this.getPattern(), obj = pattern.execGroups(string); var value = pattern.exec(string);

        // console.log(this)
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
    Pattern.prototype.check = function check ( str ) {
        var pattern = this.getPattern()
        // console.log(str.search(pattern))
        // var result = pattern.exec(str);
        var result = str.search(pattern);
        if(result > -1){
            // console.log(this.name, result)
            // result = pattern.exec(str);
            return result;
        }
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
        var values;
        if(token.repeat){
            var reg = pattern.getPattern? pattern.getPattern(compiler):pattern, source = reg && reg.source;
            source = "(("+source + ")\\s*"+token.delim+"\\s*)";
            // console.log("source::::::::::::::",source, value.match(source));
            var new_reg = new RegExp(source,"g"), ext=[];
            // console.log(source.match())
            values = value.replace(new_reg, "$&%%%%%%%").split(new RegExp(token.delim+"\\s*%%%%%%%")).map((value)=>{
                // console.log("vaslue:::::::::::",value)
                if(!pattern.getPattern){
                    // console.log("no get pattern", reg);
                    return { //can probably replace this with new instance of return token;
                         _value: value.trim(),
                         toString: function toString() {
                             return this._value;
                         },
                         valueOf: function valueof () {
                             return this._value;
                         },
                         isPattern: true,
                         __proto__: String.prototype,
                         constructor: String
                      }
                  }
                  var match = pattern.match(value);
                  return match;
            });
        }else if (token.type =="repeat") {
            values = [pattern.match? pattern.match(value) : { //can probably replace this with new instance of return token;
                 _value: value.trim(),
                 toString: function toString() {
                     return this._value;
                 },
                 valueOf: function valueof () {
                     return this._value;
                 },
                 isPattern: true,
                 __proto__: String.prototype,
                 constructor: String
              }
          ];
          if(token.alt)
          values[0]._value = values[0]._value.slice(1,values[0]._value.length-1)
        }else{
                values = [pattern.match? pattern.match(value) : { //can probably replace this with new instance of return token;
                     _value: value.trim(),
                     toString: function toString() {
                         return this._value;
                     },
                     valueOf: function valueof () {
                         return this._value;
                     },
                     isPattern: true,
                     __proto__: String.prototype,
                     constructor: String
                  }
              ];
            //   console.log( value, "::::",token);
          }
        //   console.log(":::::::::::::::::::::::::::::::::")
        //   console.log(value, values);
        if(pattern.T) values.T = values.transformPattern =  function transform ( delim ) {
            return this.map(( str , i)=>{
                if(str.transformPattern) return str.transformPattern();
                return str;
            }).filter((v)=>{ return v }).join(delim || token.delim);
        };
         if(pattern.vars){//TODO: Must make pattern have a var property to patterns, so that i can use the keys to look up the props in obj;
             var var_obj = values, ext = [];
             if(groups) obj.groups[token.index] = var_obj; else obj[token.var] = var_obj;
             values.length > 1 && pattern.vars.forEach((v)=>{ var_obj[v] = []; });
            //  console.log(var_obj);
             values.forEach((value)=>{
                 var sub_obj = value;//TODO:: must define this. must have value parameter which is the sliced string.
                 pattern.vars.forEach(function(v){
                     var_obj[v]?
                     var_obj[v].push(sub_obj[v]):
                     (var_obj[v] = sub_obj[v]); //May cause problems. take a look. we are setting the value fo the sub match to the
                    //  console.log("::::::::::::::::::::::")
                    //  console.log(v, var_obj, sub_obj)
                     if(value.T && var_obj[v] && !var_obj[v].T ) var_obj[v].transformPattern = var_obj[v].T = function transform ( delim ) {
                         if(this.map)
                         return this.map((str , i)=>{
                             if(str.transformPattern) return str.transformPattern();
                             return str;
                         }).filter((v)=>{ return v }).join(delim || token.delim);
                         else{
                            //  console.log(value);
                            //   if(this.transformPattern) return this.T();
                              return this._value;
                          }
                     };
                    // var_obj[v].jfjfjf = "nlflkjsdf"
                     var match = sub_obj[v];
                     if(match)
                     var props = Object.keys(match).map((v)=>{ return typeof match[v] !== "function" && !v.match(/^_|^[0-9]+/) &&{ value: match[v], key: v } }).filter((v)=>{ return v && v.value }).map((prop)=>{
                        //  console.log(v);
                        // var_obj[v].simple = true;
                         if(!var_obj[v][prop.key]){
                             Object.defineProperty(var_obj[v], prop.key, {
                                 get: function getfn (input) {
                                    //  console.log("this is the key", input||prop.key);
                                     var obj;
                                     var result = this.map((match)=>{
                                         obj = match[input||prop.key];
                                         return match[input||prop.key]
                                     });
                                    //  result.simple = true;
                                     result.transformPattern = result.T = function transform ( delim ) {
                                         return this.map(( str , i)=>{
                                             if(str.transformPattern) return str.transformPattern();
                                            //  console.log("IT NOT", str)
                                             return str;
                                         }).filter((v)=>{ return v }).join(delim||token.delim);
                                     };
                                     try{
                                        //  console.log("we in here");
                                         var props = Object.keys(obj).map((v)=>{ return typeof obj[v] !== "function" && !v.match(/^_|^[0-9]+/) &&{ value: obj[v], key: v } }).filter((v)=>{ return v && v.value }).map((v)=>{
                                            //  console.log(v.key);
                                             Object.defineProperty(result, v.key, { get: getfn.bind(result, v.key ) })
                                         })

                                     }catch(e){ console.log("didnt work")}
                                     return result;
                                 }
                             });
                         }
                     });

                 });

            });

         }else{
             values = values.length <= 1 ? values[0]:values;
             if(groups)
              obj.groups[token.index] = values;
             else
              obj[token.var] =  values;
         }
    }
    function returnPattern ( match, tokens, compiler, pattern ) {
        // console.log("\n:::::::::::::::::::::::::::::::::")
        // console.log(match);
        var obj = this;
        this._value = match._value;
        this._start = match._start; this._end = match._end;
        this._compiler = compiler;
        Object.defineProperties(this, {
            compiler: {
                get: function (){ return this._compiler }
            },
            c: {
                get: function (){ return this._compiler }
            }
        })
        this.transformPattern = this.T = function transform () {
            var fn =  pattern && pattern.transform;
            // console.log("we are transformaing", pattern)
            if(fn){
                return fn.call(this)
            }
            return this._value;
         };
        this.T.fn = pattern.transform;
        this.captures = pattern && pattern.captures;
        this.addCapture = this.C = pattern.capture;
        this.toString = this.valueOf = function toString (){
            return Array.isArray(this._value)&&this._value.length<=1?this._value[0]:this._value.toString();
        }
        this.pattern = pattern;
        // this.simple = true;
        // console.log(tokens)
        if(!tokens.length && pattern.captures){
            for(var i = 0; i < pattern.captures.length ; i++){
                var pat = pattern.captures[i];
                var r = pat.getPattern();
                if(this._value.match(r)){
                    pat.tokens.forEach((token)=>{
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
                        if(token.type == "repeat" && token.var ){
                            handle(token, value, token.reg_pattern, compiler, obj)
                        }
                    })
                    break;
                }
            }
        }else{
            // console.log(pattern, !!compiler)
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
                if(token.type == "repeat" && token.var ){
                    handle(token, value, token.reg_pattern, compiler, obj)
                }
            });
        }

    }
    returnPattern.prototype = String.prototype;
    returnPattern.prototype.tokenize = function tokenize ( ) {
        return Pattern.tokenize(this._value);
    }
    returnPattern.prototype.toFunction = function toFunction ( input, compiler ){
        // console.log(input)
        return new Function("",input);
    }
    returnPattern.prototype.callFunction = function callFunction ( input, compiler ){
        return this.toFunction(input,compiler||this._compiler)();
    }
    return returnPattern;
}())
var Compiler = (function () {
    function Compiler () {
        this.patterns = [];

    }
    Compiler.prototype.compile = function compile ( str, debug ) {
        // console.log("Starting compile")
        str = new Source(this.input || str);
        var done, exclude = [];
        if(debug){
            process.stderr.cursorTo(0);
            process.stderr.write("Progress :: "+ Math.round(str.getProgress()*100)+"%");
            process.stderr.clearLine(1);
        }
        while(!done){
            var pos, pat, index;
            // console.log("starting")
            this.patterns.forEach((pattern, i)=>{
                // console.log(pattern.check);
                if(pattern.transform){
                    var check = str.check(pattern);
                    // console.log(check);
                    if((check||check===0)&&(check<pos||!pos)&&pattern.transform&&!exclude.includes(i)){
                        pos = check, pat = pattern, index = i;
                        // console.log(check,pattern)
                    }
                }
            });
            // console.log("DONE!!!!:::::::::::::::::::",done);
            if(pat){
                // console.log(pat)
                // if(pat.captures)console.log(pat.captures, pat.getCaptureString.call(pat))
                // console.log(`pos::${pos} : ${pat.name}`, str.getCursor())
                str.setCursor(pos);
                var t_pos = str.getPos();
                // console.log(str.getCursor())
                var match = str.match(pat);
                try{
                    match.pos = t_pos;
                    var replacement = match.T();
                }catch(e){
                    var head = str.head, tail = str.tail, pos = str.getPos(str.cursor);
                    str.revert();
                    throw e
                }
                if(!replacement && typeof replacement !== "string"){
                    // console.log("no replacement::",replacement)
                    str.revert();
                    exclude.push(index);
                }else{
                    if(typeof replacement !== "string" && replacement instanceof returnPattern == false && !replacement.isPattern )
                    throw Error(`${pat.name?pat.name+":":""}Pattern must return a String or returnPattern \n         ----------------------------------------        \n ${match.T.fn}`)
                    // console.log(match+"::match", replacement+"::replacement")
                    str.replace(match, replacement, true);
                    // console.log("after replacement", str.tail)
                    exclude = [];
                }
                if(str.terminated) done = true;
                if(debug){
                    process.stderr.cursorTo(0);
                    process.stderr.write("Progress :: "+ Math.round(str.getProgress()*100)+"%");
                    process.stderr.clearLine(1);
                }
            }else
                done = true;

                pos=pat = undefined;
        }
        var options = {
            indent: "\t",  // Switch to tabs for indentation
            newline: "\r\n"  // Windows-style newlines
        };
        if(debug) {
            process.stderr.cursorTo(0);
            process.stderr.write("Progress :: 100%");
        }
        var start = this.start||"", end = this.end||"";
        if(this.toUnpend){
            this.toUnpend = this.start = this.end = null;

        }
        try{
            return pretty(start + str.computed + end,options);
        }catch(e){
            return start + str.computed + end;
        }
    }
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
    Compiler.prototype.reset  = function reset () {
        this.patterns = this.patterns.filter(function(v){
            return v.important
        });
    }
    Compiler.prototype.persist  = function persist () {
        this.patterns.forEach(function(v){
            v.important = true;
        });
    }
    Compiler.prototype.wash = function wash () {
        this.patterns= this.patterns.filter(function(v){ return !v.temp })
    }
    Compiler.prototype.prepend = function prepend ( input ) {
        this.start = (this.start||"")+input;
    }
    Compiler.prototype.append = function append ( input ) {
        this.end = (this.end||"")+input;
    }
    Compiler.prototype.unpend = function unpend ( flag ) {
        if(flag)
            this.end = this.start = null;
        else
            this.toUnpend = true;
    }
    Compiler.Pattern = Pattern;
    return Compiler;
}());

module.exports = Compiler;
