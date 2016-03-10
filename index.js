var scan = require("pstrscan");
var str = new scan(`hjgg [1,2,3] sedfsff sfsfs sf [ 1, 2, 3, 4, [ 5,6], ['jamel', ['tony', {name:susan }]]]; var x ==  100; var arr = [1,2,3]`);

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
String.prototype.sreplace = function ( position, pattern, expression ) { //not being used
    var other = this.substr(position).replace(pattern,expression);
    /*console.log("OTHER BOY:::::::",other)*/
    return this.substr(0, position) + other;
}
RegExp.prototype.merge = function merge (value) {
    var self = this.toString().replace(/[\/](.+)[\/]$/,"$1"), other = value.toString().replace(/[\/](.+)[\/]$/,"$1");
    return new RegExp(self+"|"+other);
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
        return new RegExp(`(${v.source})`);
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
    comment: /\/\*.*\*\/|\/\/.*[\n\r]/,
    whitespace: /\s*/,
    vartype: /\$\w[\w0-9]+\s*:\s*(group|str|num|val|lit|op|punc|comment|expr|afunc|func)/,
    var: /\$\w[\w0-9]+/,
    lit: /\b[A-z]\w*/,
    num:/[0-9]+/,
    get val () {
        return this.num.merge(this.lit);
    },
    delim_ellips: /\((\W+)\)\s*\.\.\./g,
    ellipses: /\.\.\./,
    punc: /[.!,:;]/,
    delim:/[\{\}\[\]\(\)]/,
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
    afunc: /\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)=>(\{(?:[^}{]+|\{(?:[^}{]+|\{[^}{]*\})*\})*\}|.*(?=\)|,|;))/,
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
    pattern.variables = {};
    for(var i = 0; i < types.length; i++ ){
        var key = types[i], type = _types[key], prev;
        var result = type.scan(str);
        if(result){
            if(key == "vartype"){
                // console.log("inside make pattt::::", _types[result.class])

                pattern.push(_types[result.class]);
                pattern.variables[result.variable] ={ index: num+offset, type: result.class };
                if(_types[result.class].captured) pattern.variables[result.variable].dynamic = true;
                num++;
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
                    last = last instanceof RegExp? new RegExp(`(\\s*${last.source+spc.source}\\s*${ escapeRegExp(result.captures[1]) }\\s*)+${last.source+spc.source}`):new RegExp(`(\\s*${last+spc.source}\\s*${ escapeRegExp(result.captures[1]) }\\s*)+${last+spc.source}`);
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

function Pattern ( pattern, transform ) {
    //@params - string
    this.rule = makePattern(pattern);
    var transformed = false;
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
                /*console.log(result)*/
                var args = keys.forEach((v, k)=>{
                    var a = arguments[vars[v].index];
                    if(!Array.isArray(a)){
                        a = a.trim().split(d[k]||" ")
                     }
                     result = result.replace(`$${vars[v].index}`, a.join(delims[k]) )
                     /*console.log(result);*/
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
    this.expression = transform
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
}
Compiler.prototype.compile = function compile ( input ) {
    var input = input || this.source;
    var program = new scan(input), reg, check = [1], pos, last;
    while(check.length && !program.hasTerminated()){
        /*console.log(program)*/
        check = this.patterns.map(function(v){
                var result =  program.checkUntil(v.rule.toRegExp());
                // console.log("start:::::::::::", (result && pos && program.start < pos)||(result && !pos), program.start, program.pos,  result, v.rule.toRegExp() );
                var curr =  v.rule.toRegExp().source
                /*if((result && pos && result < pos)||(result && !pos) ){ pos = result; reg = v; last =  curr }
                else if((result && pos && result == pos &&  v.rule.toRegExp().source.length > last.length) ){ pos = result; reg = v; last = curr }*/

                if((result && pos && program.start < pos)||(result && pos == undefined) ){ pos = program.start ; reg = v; last =  curr }
                return result
        }).filter(function(v){ return v });
        if(reg){
            var rule = reg.rule[0].captured ? _types[reg.rule[0].key] : reg.rule[0];
            // console.log(rule)
            program.scanUntil(rule);
            // console.log(program, reg.rule[0])
            program.unscan();
            var pattern =  reg.rule.toRegExp();
            var result = pattern.scan(program);
            // console.log("POSITIVE PATTERN::::", pos, pattern, result);
            /*console.log("we matched:::", pattern)*/
            var toReplace = result.value.replace(pattern, typeof reg.expression == "function"?reg.expression.bind(result.value):reg.expression);
            /*console.log("RESULTS AND ", result.value,"::::::", toReplace);*/
            input = input.replace(result.value, toReplace);
            /*console.log(input);*/
            /*input = input.replace( pattern, typeof reg.expression == "function"?reg.expression.bind(input):reg.expression);*/
            //probably wont work for nested types... meaning a type definition in the rule that itself has a type def in it.
            //probably also wont work for ellips
            /*console.log(reg.rule)*/
            reg.rule.forEach(function(v){
                if(v.expression){
                    // console.log("v has an expression", v);
                    var global_reg = new RegExp(v.orig.source, "g");
                    input = input.replace(global_reg, typeof v.expression == "function"?v.expression.bind(input):v.expression)
                }
            });
            this.pos = pos;
            reg = pos = null;
        }
    }
    return input;
}
Compiler.prototype.addSource = function addSource ( code ) {
    this.source = code;
}
Compiler.prototype.addPattern = function add ( pattern, transform ) {
    var pattern = new Pattern(pattern, transform);
    this.patterns.push(pattern);
    return pattern;
    /*console.log(this.patterns[this.patterns.length-1])*/
}
Compiler.prototype.addType = function addType ( name, pattern, transform ) {
    var pat = this.addPattern(pattern, transform);
    var source = _types.vartype.source;
    _types.vartype =  new RegExp(source.splice(source.length-1, "|"+name));
    _types.vartype.key = "vartype";
    // console.log("what type", _types.vartype)
    // _types[name] = pat.rule.toRegExp();
    // // if(Object.keys(pat.variables).length)
    // _types[name].orig = _types[name];
    // _types[name].expression = pat.expression;
    Object.defineProperty(_types, name, {
        get: function () {
            var value = pat.rule.toRegExp();
            value.expression = pat.expression;
            value.orig = value;
            value.captured = true;
            value.key = name;
            // console.log("We are in a type", value)
            if(Object.keys(pat.rule.variables).length)
                value.vars = Object.keys(pat.rule.variables);
            return value;
        },
        enumerable: true
    })
    return pat;
}
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
        /*console.log(_types[name]);*/
        // console.log("compiler.pos")
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
    // console.log("we made a capture", name, _types[name])
}



var a = new Compiler();
a.addPattern("no one knows my $word:lit", "run($word)");
a.addCapture("variable","var $name:lit =", "$name");
a.addPattern("hello $name:variable", "convert($name)").rule.variables;
a.addPattern("welcome $name:variable( )...", "not_convert($name(,)...)").rule.toRegExp();
a.addCapture("fn","function $name:lit", "$name");
a.addPattern("$subject:variable $verb:fn $pred:variable","$verb.call($subject, $pred)")
a.addPattern("let $name:lit = $ex:expr", "let('$name', $ex)");
a.addType("salutation","with me", "no way");
a.addType("greet","with $va:variable", "do_another($va)");
a.addPattern("go $ss:salutation","do_nothing($ss)");
a.addPattern("go $ss:greet","do_something($ss)");
// a.addPattern("hello $other:group", "group($other)")
console.log(a.compile(`var jamel = 10 ;
    hello jamel;
    var home = 10;
function runs () {
    return x;
}
welcome jamel home;
jamel runs home;
let jam = (a,b,c)=>{a+b+c};
let stupid = with me;
go with me
go with jamel
`));
// console.log(_types.variable)
/*var reg = makePattern("jamel $name: lit ... again $num:num ... ")
console.log(reg)``
console.log("jamel cole cole ass cole again 9382 48383 273".replace(reg.toRegExp(), "$1 $3"))*/
/*console.log(str.scanUntil(_types.group))*/
module.exports = Compiler;
