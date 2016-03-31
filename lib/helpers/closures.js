function Closure (type) {
    var split = type.split(""), open = type[0], close = type[1];
    this.open = open, this.close = close;
}
Closure.prototype.check = function ( str ) {

}
Closure.prototype.match = function ( str ) {
    var depth = 0, match = false, start = 0, end = 0, strreg = /(^\"(\\.|[^"])*\")|(^\'(\\.|[^'])*\')/;
    for(var i = 0; i < str.length; i++ ){
        var tail = str.slice(i, str.length), match = null;
        // console.log("start", i, tail)
        if(match = strreg.exec(tail)){
            // console.log(match);
            i = i+match.index + match[0].length;
            // console.log(str.slice(i, str.length));
            continue;
        }
        // console.log("continuing")
        var token = str[i];
        if(token == this.open){
            // console.log(depth, tail)
            if(depth === 0) start = i;
             depth++;
         }
        if(token == this.close){
            depth--;
            if(depth === 0){
                match = true, end = i;
                break;
            }
        }
    }
    if(match){
        var result = [str.slice(start,end+1)];
        result.index = result.start = start;
        result.end = end+1;
        return result;
    }
}
