--- //code-block
    //declare variables using the `ctx` keyword.
    ctx isNumber = function (input) {
        return !isNaN(+input)
    }
    ctx isString = function(input){
        var str = /^((\"(\\.|[^"])*\")|(\'(\\.|[^'])*\'))$/;
        return !!str.exec(input.trim())
    }
---

pattern funct { async function ($params...) {$body...} }=>{
    var body = this.c.compile(this.body);
    return `function (${this.params}) {
        return new Promise(function (resolve, reject){
            ${body}
        })
    }`
}

pattern funct { async function $name:lit ($params...) {$body...} }=>{
    var body = this.c.compile(this.body);
    return `function ${this.name} (${this.params}) {
        return new Promise(function (resolve, reject){
            ${body}
        })
    }`
}
pattern { await $name:lit = $value... ; $rest... }=> {
    var rest = compile("\n"+this.rest);
    var p = this.c.addPattern("return $value... ;", function(){
        return `resolve(`+this.value+`)`;
    });
    p.temp = true;
    if(isNumber(this.value)||isString(this.value)){ //you can use variables declared in compile-time blocks
        this.value = `Promise.resolve(${this.value})`;
    }
    var res = `return `+this.value+`.then(function(${this.name}){
            `+compile(rest)+`
        })`;
    this.c.wash();
    return res;
}

async function go_get_data ( ) {
     await something = $.fetch("./somewhere.js");
     var a = something.replace("some words","nothing");
     await long_operation = do_operation(a);
     return long_operation;
}
