var scan = require("smpl-pstrscan");
var pretty = require("pretty-js");
//SYNTAX
/**************
    $NAME
    $NAME:TYPE
    ...
    LITERAL
*************/



/*********************SECTION: Prototype Changes**********************/
String.prototype.splice = function ( position, text ) {
    return this.substr(0, position) + text + this.substr(position)
}
/*String.prototype.splice = function ( p1,p2, text ) {
    if(!text) return this._splice(p1,p2);
    return this.substr(0, p1) + text + this.substr(p2)
}*/
String.prototype.sreplace = function ( pos, pattern, expression ) {
    /*console.log("OTHER BOY:::::::",other)*/
    return this.slice(0, pos) + this.slice(pos, this.length).replace(pattern, expression)
}
RegExp.prototype.merge = function merge (value) {
    var self = this.toString().replace(/[\/](.+)[\/]$/,"$1"), other = value.toString().replace(/[\/](.+)[\/]$/,"$1");
    return new RegExp(self+"|"+other);
}
RegExp.prototype.g = function global () {
    var self = this.source
    return new RegExp(self,"g");
}
RegExp.prototype.join = function join (value) {
    var self = this.toString().replace(/[\/](.+)[\/]$/,"$1"), other = value.toString().replace(/[\/](.+)[\/]$/,"$1");
    return new RegExp(self+other);
}
RegExp.prototype.groupjoin = function groupjoin (value, secondOnly) {
    var self = this.toString().replace(/[\/](.+)[\/]$/,secondOnly? "$1" : "($1)"), other = value.toString().replace(/[\/](.+)[\/]$/,"($1)");
    return new RegExp(self+"|"+other);
}
RegExp.prototype.check = function check  ( input ) {
    result =  input.checkUntil(input);
    if(result == null ) return false;
    return result;
}
RegExp.prototype.scan = function scan ( input, scanUntil ) {
    var pos = input.getPosition(), matched;
    if(scanUntil) matched = input.scanUntil(this);
    else matched = input.scan(this);
    if(!matched) { input.revert(pos); return false;}
    var result = { type: _typeIds[this.key],  value: input.getMatch(), pos: [pos, input.getPosition()-1]};
    if(this.key == "vartype"){
        var values = result.value.split(":");
        result.variable = values[0].trim();
        result.class = values[1].trim();
        // console.log(result.class);
    }
    if(this.key == "delim_ellips"){
        result.captures = input.captures
    }
    return result;
}
if(!Array.prototype.includes){
    Array.prototype.includes = function includes ( value ) {
        return this.indexOf(value) > -1
    }
}
Array.prototype.split = function split ( value ) {
    return this.map((v,k)=>{
        if(k !== this.length-1) return [v,value];
        else return v; })
        .reduce((a,b)=>{ return a.concat(b)})
}
Array.prototype.toRegExp = function toRegExp () {
    // console.log("we are calling this", this)
    var delims = [];
    var result =  this.map(function(v){
    if( v === "$...$" ) return "+";
    if( v.ellips ){
        delims.push(v.delim.match(/\s+/)?/\s+/:v.delim)
        if(v.captured){
            var replaced = v.source.replace(new RegExp(v.orig.source,"g"), `(${_types[v.key].source})`);
            // console.log(v,"::::::::::::::::::",replaced)
            return new RegExp(`(${replaced})`)
        }

        return new RegExp(`(${v.source})`);
    }
    if(v instanceof RegExp == false)
        return new RegExp(escapeRegExp(v))
    if(v.source == "\\s*")
        return v;
    if(v.captured){
        // console.log(_types[v.key])
        return new RegExp(`(${_types[v.key].source})`)
    }
        var reg = new RegExp(`(${v.source})`);
        reg.expression = v.expression;
        return reg;
    }).reduce((a,b)=>a.join(b))
    result.delims = delims;
    return result;
}
Array.prototype.toObj = function toObj () {
    var obj = {};
        this.forEach(function(v){ obj[v[0]] = v[1] });
    return obj;
}
/*********************SECTION-END: Prototype Changes**********************/


/*********************SECTION: Private Variables & Functions**********************/
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

const _delims = {
    lparen: /\(/,
    rparen: /\)/,
    lbrack: /\{/,
    rbrack: /\}/,
    lsquar: /\[/,
    rsquar: /\]/
}
function _mergeRegex( input ) {
    return input.reduce(function(a,b){ return a.merge(b) })
}
function Delim ( input, scanUntil ) {
    var open = [_delims.lparen, _delims.lsquar, _delims.lbrack],  close = [_delims.rparen, _delims.rsquar, _delims.rbrack],
        OPEN, pos, proceed = true, source = input.source, remainder = source, startpos = input.getPosition();
    open = open.map(function(value, k){
        if(proceed){
            if(scanUntil) var result = input.scanUntil(value);
            else var result = input.scan(value);
            if(result) {
                OPEN = scanUntil?input.match:result;
                close = close[k];
                proceed = false;
                return value;
            }
        }
    }).filter(function( value ){
        return value;
    });
    if(!open.length) return false;
    pos = input.getPosition();
    open = open[0];
    var ccheck = input.checkUntil(close), ocheck = input.checkUntil(open), extra;
    while(ocheck&&ccheck&& ocheck < ccheck ){
        extra = Delim(input, true );
        ccheck = input.checkUntil(close), ocheck = input.checkUntil(open)
    }
    if ( !input.scanUntil(close) ){  input.revert(startpos); return false;}
    var result = { type:4, delim: OPEN+input.getMatch(), value: input.getPreMatch().slice(pos, input.getPosition()), pos: [pos, input.getPosition()-1] };
    input._before = [];
    return result;
}
Delim.scan = Delim;
Delim.exec = function exec ( value, scanUntil ) {
    var s = new scan(value);
    var result = this.scan(s, scanUntil);
    if(!result) return null;
    var arr = [result.value]
    arr.index = result.pos[0]+1
    arr.input = value;
    return arr;
}
Delim.source = true;
Delim.check = function (input) {
    var open = _delims.lparen.merge(_delims.lbrack).merge( _delims.lsquar);
    open =  input.checkUntil(open);
    if(open == null ) return false;
    return open;
}
Delim.advance = function ( input ) {
    if(input.scanUntil( _delims.lparen.merge(_delims.lbrack).merge( _delims.lsquar)))
    input.unscan();
    return input;
}
/*
types:
    0: whitespace
    1: lit
    2: num
    3: str
    4: group
    5: punc
    6: op
    7: var
    8: ellipses
*/
const _typeIds = {
    whitespace: 0,
    lit: 1,
    num: 2,
    str: 3,
    group: 4,
    punc: 5,
    op: 6,
    var: 7,
    ellipses: 8,
    comment: 9,
    delim: 10,
    delim_ellips: 11
}
const _types = {
    // str: /(["'])((\\{2})*|(.*?[^\\](\\{2})*))\1/,
    str: /(\"(\\.|[^"])*\")|(\'(\\.|[^'])*\')/,
    comment: /\/\*(.|\s)*\*\/|\/\/.*[\n\r]/,
    whitespace: /\s*/,
    vartype: /\$\w[\w0-9]+\s*:\s*(group|str|num|val|lit|op|punc|comment|expr|afunc|func|paren|curly|brack)/,
    var: /\$\w[\w0-9]+/,
    lit: /\s?[A-z]\w*/,
    num:/[0-9]+/,
    get val () {
        return this.num.merge(this.lit);
    },
    delim_ellips: /\(((\W)+?)\)\s*\.\.\./g,
    ellipses: /\.\.\./,
    punc: /[.!,:;]/,
    delim:/[\{\}\[\]\(\)]/,
    pattern_group: /\$\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/,
    paren: /\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/,
    curly: /\{(?:[^}{]+|\{(?:[^}{]+|\{[^}{]*\})*\})*\}/,
    brack: /\[(?:[^\]\[]+|\[(?:[^\]\[]+|\[[^\]\[]*\])*\])*\]/,
    op: /===|==|!==|!=|>=|<=|[><\/\+\-\*=]/,
    get type (){
        return Object.keys(this).map(function(value){ return new RegExp(value)})
                            .reduce(function(a,b){ return a.merge(b)})
    },
    colon: /[:]/,
    get group () {
        return this.paren.groupjoin(this.curly).groupjoin(this.brack, true);
    },
    func: /function\s*([A-z0-9]+)?\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)\s*\{(?:[^}{]+|\{(?:[^}{]+|\{[^}{]*\})*\})*\}/,
    afunc: /\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)\s*=\s*>\s*(\{(?:[^}{]+|\{(?:[^}{]+|\{[^}{]*\})*\})*\}|.*(?=\)|,|;))/,
    get expr () {
        var pat = this.str.groupjoin(this.lit).groupjoin(this.num,true), fns = this.func.groupjoin(this.afunc),
        exclude = ["str", "comment", "whitespace", "vartype", "var", "lit", "num", "val", "expr", "delim_ellips", "ellipses", "punc", "delim", "paren", "curly", "brack", "op", "type", "colon", "group", "afunc", "func"];
        var rest = Object.keys(this).map((key)=>{ if(!exclude.includes(key)) return this[key] })
                    .filter((value)=>{ return value });
                if(rest.length){
                    // console.log("the first rest", this.variable);
                    rest = rest.reduce((a,b,k)=>{
                        // console.log(a);
                        return a.groupjoin(b,k == 1);
                    });
                    // console.log("the rest:::::::::::::",rest)
                    pat = rest.merge(fns).merge(this.group).merge(pat);
                    pat.captured = true;
                    pat.key = "expr";
                    return pat;
                }

                    // console.log(rest.merge);
        pat = fns.merge(this.group).merge(pat);
        pat.captured = true;
        pat.key = "expr";
        return pat;
    }
}
const exp_types = {
    ellips: /\((\W+)\)\s*\.\.\./g
}
function newTypeClass ( name, patterns, expressions ) {
    if(!Array.isArray(patterns)) patterns = [patterns];
    if(!Array.isArray(expressions)) expressions = [expressions];
    patterns = patterns.map((p, i)=>{ return new Pattern(p, expressions[i]) });
    // console.log(patterns);
    // , expressions = expressions.map((p)=>{ return new RegExp(p) })
    // console.log("we making   type", patterns)
    Object.defineProperty(_types, name, {
        get: function () {
            var result = patterns.map((p)=>{ return p.rule.toRegExp() }).reduce( (a,b,k)=> {
                // console.log(a.rule)
                return a.groupjoin(b, k!==1)
            });
            result.scan = function ( scanner ) {
                // console.log("scanning", scanner)
                var value = false;
                for( var i = 0; i < patterns.length; i++ ){
                    var value = scanner.scan(patterns[i].rule.toRegExp());
                    // if(v){
                    //     scanner.unscan();
                    //     value = scanner.scan(patterns[i].rule.toRegExp())
                    // }
                    if(value) break;
                }
                if(!value) return value;
                result.expression = patterns[i].expressions;
                result.orig = patterns[i].rule.toRegExp()
                // console.log(result);
                // result.key = result.class = name;
                return { class: name, key: name, value: scanner.getMatch(), pos:[ scanner.start, scanner.getPosition() ]}
            };
            result.switchFor = function ( str ) {
                var value = false;
                for( var i = 0; i < patterns.length; i++ ){
                    var value = str.match(patterns[i].rule.toRegExp());
                    if(value) break;
                }
                if(!value) return value;
                result.expression = patterns[i].expression;
                result.orig = patterns[i].rule.toRegExp()
                // console.log(result);
                // result.key = result.class = name;
                return true;
            }
            result.expression = patterns[0].expression;
            result.orig = patterns[0].rule.toRegExp();
            result.captured = true;
            result.key= result.class = name;
            return result;
        }, configurable: true
    });
    _types.vartype =  new RegExp(_types.vartype.source.splice(_types.vartype.source.length-1, "|"+name));
    _types.vartype.key = "vartype";
    // console.log(_types.vartype);
    // console.log(_types[name])
}
Object.keys(_types).map(function(v, key ){
    _types[v].key = v;
});
function tokenize ( value ) {
    var str = new scan(value), types = Object.keys(_types), pattern = [];
    for(var i = 0; i < types.length; i++ ){
        var key = types[i], type = _types[key];
        var result = type.scan(str);
        if(result){
            pattern.push(result);
            i=0;
        }
    }
    if(!str.hasTerminated()) return false;
    return pattern;
}

function makePattern ( value ) {
    var str = new scan(value), types = Object.keys(_types), pattern = [], num = 1, offset = 0;
    pattern.variables = {}; pattern.pattern_groups = [];
    for(var i = 0; i < types.length; i++ ){
        var key = types[i], type = _types[key], prev;
        var result = type.scan(str);
        if(result){
            if(key == "vartype"){
                // console.log("inside make pattt::::", result , type,  _types[result.class])

                pattern.push(_types[result.class]);
                pattern.variables[result.variable] ={ index: num+offset, type: result.class };
                if(_types[result.class].captured) pattern.variables[result.variable].dynamic = true;
                num++;
            }else if ( key == "pattern_group"){
                // console.log("we got a pattern group", result.value);
                var reg = /\$\s*\(((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/;
                var stripped = result.value.replace(reg, "$1");
                var pat = makePattern(stripped);
                reg = pat.toRegExp();
                reg.variables = pat.variables;
                reg.pat = pat;
                pattern.push(reg);
                pattern.pattern_groups.push(pattern.length-2);
                // pattern.push(_types.whitespace);
            }else if(key == "whitespace"){
                pattern.push(_types.whitespace);
            }else if ( key == "ellipses") {
                //think about how to handle this... currently i am thinking we have to make a new regex from the last index in parenths with a wildcard
                //may need to change this to be more like "delim_ellips"
                if(prev == "whitespace"){
                    var spc = pattern.pop(), last = pattern.pop(), expr = last.expression, captured = last.captured ? last.key: undefined;

                    last = last instanceof RegExp? new RegExp(`(${last.source+spc.source})+`):new RegExp(`(${last+spc.source})+`);
                    if( last instanceof RegExp) offset++;
                    if(expr) last.expression = expr;
                    if(captured){
                        last.captured = true;
                        last.key = captured;
                    }
                    pattern.push(last)
                }else
                    pattern.push("$...$")
            }else if ( key == "delim_ellips") {
                //think about how to handle this... currently i am thinking we have to make a new regex from the last index in parenths with a wildcard
                    if(prev == "whitespace"){
                        var spc = pattern.pop(), last = pattern.pop(), expr = last.expression, orig = last,captured = last.captured ? last.key: undefined;
                    }else{
                        var last = pattern.pop(), spc = pattern.pop(), expr = last.expression, orig = last,captured = last.captured ? last.key: undefined;
                    }
                    /*console.log("last:::::::::", last, spc)*/
                    last = last instanceof RegExp? new RegExp(`(\\s*${last.source+spc.source}\\s*${ escapeRegExp(result.captures[1]) }\\s*)*${last.source+spc.source}`):new RegExp(`(\\s*${last+spc.source}\\s*${ escapeRegExp(result.captures[1]) }\\s*)*${last+spc.source}`);
                    if( last instanceof RegExp) offset++;
                    if(expr) last.expression = expr;
                    if(captured){
                        last.captured = true;
                        last.key = captured;
                    }
                    last.delim = result.captures[1]; //might need to check this inde3x
                    last.ellips = true;
                    last.orig = orig;
                    pattern.push(last);
                    /*console.log(last)*/
                /*}else
                    pattern.push("$...$")*/
            }else{
                pattern.push(result.value)
            }
            prev = key
            i=0;
        }
    }
    if(!str.hasTerminated()) return false;
    return pattern;
}

/*********************SECTION-END: Private Variables & Functions**********************/

function Pattern ( pattern, transform, important ) {
    //@params - string
    this.rule = makePattern(pattern);
    var transformed = false;
    if(this.rule.pattern_groups.length){
        // console.log("we have pattern groups", this.rule.pattern_groups);
        var matches = transform.match(_types.pattern_group.g());
        var reg = /\$\s*\(((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/;
        var t = transform, self = this.rule;
        matches.forEach(function(match, k ){
            var stripped = match.replace(reg, "$1");
            this[this.pattern_groups[k]].expression = match;
            this[this.pattern_groups[k]].raw = stripped;
            this[this.pattern_groups[k]].grouped = true;
            // console.log(this[this.pattern_groups[k]]);
        }.bind(this.rule));
        var delim_ellips = new RegExp(_types.delim_ellips.source, "g");
        var delim = t.match(delim_ellips), count = 0;
        t = t.replace(delim_ellips,"");
        if(delim.length){
            delim = delim.map((d)=>{ return d.match(/\(\s*(\W)\s*\)/)[1] })
        }
        //right now this will probably only work for a single appearance of a group
        transform = function trans () {
            var result = t;
            self.forEach((v)=>{
                if(v.grouped){
                    // console.log("this is grouped", v);
                    var orig = v.orig.source; var global_reg = new RegExp(orig, "g"), vars = v.orig.pat.variables, raw = v.raw;
                    var matches = this.match(global_reg), keys = Object.keys(vars), matched_obj = {}, toTransform = new Array(matches.length).fill(raw);
                    if(keys.length){
                        keys.forEach((variable, i)=>{
                            var m = matches.map((match)=>{
                                return match.match(v.orig)[vars[variable].index];
                            });
                            matched_obj[variable] = m;
                            // console.log("these are your matches", m);
                        })
                    }
                    for(var i in matched_obj) {
                        toTransform = toTransform.map(( raw, key )=>{
                            return raw.replace(i, matched_obj[i][key])
                        })
                    }
                    console.log("orig result   ",this);
                    var replacement = toTransform.join(delim[count]);
                    count++;
                    result = result.replace(v.expression, replacement);
                    console.log("new result    ", result);
                    console.log( t, replacement);
                }
            });
            return result;
        }
    }
    if(this.rule.variables && typeof transform !== "function" ){
        var keys = Object.keys(this.rule.variables), vars = this.rule.variables;
        keys.map((v)=>new RegExp(escapeRegExp(v), "g")).forEach((v, k)=>{
            transform = transform.replace(v, `$${ vars[keys[k]].index }` );
        });
        var ellips, delims = [];
        while(ellips = exp_types.ellips.exec(transform)){
            delims.push(ellips[1]);
        }
        if(delims.length){
            var str = transform.replace(exp_types.ellips,"");
            var keys = Object.keys(this.rule.variables), vars = this.rule.variables, d = this.rule.toRegExp().delims;

            transform = function transform () {
                var result = str;
                var args = keys.forEach((v, k)=>{
                    var a = arguments[vars[v].index];
                    if(!Array.isArray(a)){
                        a = a.trim().split(d[k]||" ")
                     }
                     result = result.replace(`$${vars[v].index}`, a.join(delims[k]) )
                });
                return result;
            }
            transformed = true;
        }

    }
    if(!transformed && this.rule.variables && typeof transform == "function" ){
        var keys = Object.keys(this.rule.variables), vars = this.rule.variables, fn = transform;
        transform = function transform (){
            var args = keys.map((v, k)=>{
                return arguments[vars[v].index]
            });
            return fn.apply(this, args);
        }

    }

    this.expression = transform;
    this.important = important
}
Pattern.transform = function transform (arr) {
    var variables = this.rule.variables, keys = Object.keys(variables), result = this.expression;
    keys.forEach(function(v){
            result = result.replace(v, arr[variables[v]])
    });
    return result;
}
Pattern.prototype.or = function or ( pattern ) {

}
function Compiler ( code ) {
    this.addSource(code);
    this.patterns = [];
    this.pos = 0;
    this.indexes = [];
    this._index = 0;
    Object.defineProperties( this,{
        "index" : {
            get: function(){
                return this._index - this.diffindex;
            }
        },
        "diffindex" : {
            get: function(){
                return (this.indexes.length > 1? this.indexes.reduce(function(a,b){ return a+b }) : this.indexes.length == 1 ? this.indexes[0]: 0 )
            }
        }
    })
}
Compiler.prototype.clear = function () {
    this.patterns = this.patterns.filter(function(pattern){ return pattern.important })
}

Compiler.prototype.compile = function compile ( input, important ) {
    var input = input || this.source;
    var program = new scan(input), reg, check = [1], pos, last;
    this._index = 0;
    this.indexes = [];
    while(check.length && !program.hasTerminated()){
        /*console.log(program)*/
        check = this.patterns.map(function(v){
                var result =  program.checkUntil(v.rule.toRegExp());
                // console.log("start:::::::::::", (result && pos && program.start < pos)||(result && pos == undefined), program.start, program.pos,  result, v.rule.toRegExp() );
                var curr =  v.rule.toRegExp().source

                if((result && pos && program.start < pos)||(result && pos == undefined) ){ pos = program.start ; reg = v; last =  curr }
                return result
        }).filter(function(v){ return v });
        if(reg){
            var rule = reg.rule[0].captured ? _types[reg.rule[0].key] : reg.rule[0];
            program.scanUntil(reg.rule.toRegExp());
            // console.log(rule, program)
            program.unscan();
            var pattern =  reg.rule.toRegExp();
            var result = pattern.scan(program);
            if(!result.value){
                // console.log(pattern, program.pos);
                this.pos = pos;
                this._index = program.pos;
                // console.log(input.slice(0, this.index), "::::::" ,input.slice(this.index, input.length),  this.index);
                reg = pos = null;
                throw [program, result];
            }
            var toReplace = result.value.replace(pattern, typeof reg.expression == "function"?reg.expression.bind(result.value):reg.expression);
            // console.log("RESULTS AND ", result.value,"::::::",reg.expression,"::::::::::::\n", toReplace, "::::: INPUT :::::::::", input, ":::::::::::::END\n" );
            // input = input.replace(result.value, toReplace);
            input = input.sreplace(this.index, result.value, toReplace);
            this.indexes.push( ( result.value.length - toReplace.length ) ); //calculates the current cursor after replacement has been performed.
            // console.log("new input :::::::::::::", input);
            //probably wont work for nested types... meaning a type definition in the rule that itself has a type def in it.
            //probably also wont work for ellips
            reg.rule.forEach(function(v){
                if(v.expression){
                    // console.log("v has an expression", v, "::::::::::", this.index,input.sreplace(this.index, new RegExp(v.orig.source, "g"), v.expression));
                    var global_reg = new RegExp(v.orig.source, "g");
                    if(v.switchFor){
                        v.switchFor(toReplace);
                        global_reg = new RegExp(v.orig.source, "g");
                        //  console.log("after::::: ",v);
                     }
                    // input = input.replace(global_reg, typeof v.expression == "function"?v.expression.bind(input):v.expression)
                    var newReplace = toReplace.replace(global_reg, typeof v.expression == "function"?v.expression.bind(toReplace):v.expression);
                    // console.log(v.orig, v.expression)
                    // console.log(toReplace, ":::::::::", newReplace);
                    input = input.sreplace(this.index, toReplace, newReplace);
                    // console.log(input)
                }
                if(v.vars){
                    // input = input.replace(_types[v.key], typeof v.expression == "function"?v.expression.bind(toReplace):v.expression);
                    input = input.sreplace(this.index, _types[v.key], typeof v.expression == "function"?v.expression.bind(toReplace):v.expression);
                }
            }.bind(this));
            this.pos = pos;
            this._index = program.pos;
            // console.log(input.slice(0, this.index), "::::::" ,input.slice(this.index, input.length),  this.index);
            reg = pos = null;
        }
    }
    options = {
        indent: "\t",  // Switch to tabs for indentation
        newline: "\r\n"  // Windows-style newlines
    }
    if(important){
        this.patterns.forEach(function(pattern){ pattern.important = true; })
    }
    return pretty( input , options);
}
Compiler.prototype.addSource = function addSource ( code ) {
    this.source = code;
}
Compiler.prototype.addPattern = function add ( pattern, transform, important ) {
    var pattern = new Pattern(pattern, transform, important);
    this.patterns.push(pattern);
    return pattern;
    /*console.log(this.patterns[this.patterns.length-1])*/
}
Compiler.prototype.addType = function addType ( name, pattern, transform ) {
    var pat = this.addPattern(pattern, transform);
    var source = _types.vartype.source;
    _types.vartype =  new RegExp(source.splice(source.length-1, "|"+name));
    _types.vartype.key = "vartype";
    Object.defineProperty(_types, name, {
        get: function () {
            var value = pat.rule.toRegExp();
            value.expression = pat.expression
            value.orig = value;
            value.captured = true;
            value.key = name;
            if(Object.keys(pat.rule.variables).length){
                value.vars = true;
                value.expression = function(){
                    pat.expression;
                    return this.match(_types[value.key])[0].replace(_types[value.key], pat.expression)
                };
            }
            return value;
        },
        enumerable: true
    })
    return pat;
}
Compiler.prototype.makeType = newTypeClass
/*
Desired functionality
............................
Compiler.addCapture( "var", "var $name:lit ", "$name")
the second param symbolizes how you would like to recognize the class in other contexts.
*/
Compiler.prototype.addCapture = function addCapture ( name, pattern, transform, meta ) {
    var fn = function () {
        var input = "", t;
        input = this.match(p.rule.toRegExp())[0];
        if(p.rule.variables){
            Object.keys(p.rule.variables).forEach(function(v){
                transform = transform.replace(v,`$${p.rule.variables[v].index}`);
            });
            /*console.log(transform)*/
        }
        var capture = input.replace(p.rule.toRegExp(), transform);
        /*console.log(input,":::::::::", capture);*/
        var source = _types[name].source;
        _types[name] =  new RegExp(source+"|"+capture);
        _types[name].captured = true;
        _types[name].key = name;
        // console.log(name, _types[name])
        return meta?"":this;
    },
    p = this.addPattern( pattern, fn ), source = _types.vartype.source, compiler  = this;
    _types.vartype =  new RegExp(source.splice(source.length-1, "|"+name));
    _types.vartype.key = "vartype";
    _types[name] = new RegExp(`PARSER${name}`);
    _types[name].captured = true;
    _types[name].key = name;
}
Compiler.prototype.types = _types;
module.exports = Compiler;
