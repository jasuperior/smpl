var Source = (function(){
    function escapeRegExp(str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
    function Source ( value ) {
        this.value = value+"";
        this.computed = value+"";
        this.trail = [];
        var start = 0;
        this.lines = this.value.split(/[\n\r]|\n\r/).map((value)=>{
            var obj = { value: value, start: start, end: start+value.length }
            start+=value.length;
            return obj;
        })
        this.cursor = 0;
        this.computedCursor = 0;
        Object.defineProperties(this, {
            terminated: { get: function(){ return this.value.length <= this.cursor } },
            tail: { get: function(){ return this.slice(this.computedCursor).tail }},
            head: { get: function(){ return this.value.slice(0,this.cursor) }}
        })
    }
    Source.prototype.slice = function slice ( pos ) {
        return { head: this.computed.slice(0,pos) , tail: this.computed.slice(pos, this.computed.length) };
    }
    Source.prototype.getCursor = function getCursor () {
        return this.cursor;
    }
    Source.prototype.match = function match ( pattern ){
        return pattern.match(this.tail, true)
    }
    Source.prototype.setCursor = function setCursor ( value ) {
        var num = parseInt(value), diff = num - this.computedCursor;
        // console.log(value, num, diff, this.computedCursor);
        // if(num  === 0 ) return this.cursor;
        if(diff < 0) throw Error("you cannot progress the cursor backward")
        this.cursor += diff;
        this.computedCursor=num;
        return this.cursor;
    }
    Source.prototype.check = function check ( pattern ) {
        // console.log(`checking:: ${pattern.getPattern()}`)
        var check = pattern.check( this.tail );
        if(!check&&check!==0) return check
        // console.log("check "+pattern.name,this.computedCursor+check)
        return this.computedCursor + check ;
    }
    Source.prototype.revert= function revert ( steps ){
        steps = steps || 1;
        var pos;
        for(var i =0; i < steps; i++ ){
            pos = this.trail.pop();
        }
        if(pos){
            this.cursor = pos[0];
            this.computedCursor = pos[1];
        }
    }
    Source.prototype.replace = function replace ( pattern, replacement, advance ) {
        var parts = this.slice(this.computedCursor);
        var rpat = new RegExp("^"+escapeRegExp(pattern+""));
        if(!parts.tail.match(rpat)) return false;
        var match = rpat.exec(parts.tail);
        parts.tail = parts.tail.replace(rpat, replacement);
        // console.log("pzarts:"+parts.tail);
        var result = parts.head + parts.tail;
        if(advance){
            this.trail.push([this.cursor,this.computedCursor])
            this.computedCursor += match.index + (replacement+"").length;
            this.cursor += match.index + (pattern+"").length;
        }

        this.computed = result;
        return result;
    }
    Source.prototype.getPos = function getPos ( index ) {
        var result;
        for( var k in this.lines ){
            var v = this.lines[k];
            // console.log(index, v)
            if( index >= v.start && index <= v.end ) {
                var ndex = index - v.start;
                result = { line: parseInt(k)+1, column: ndex+1 }
                break;
            }
        };
        // console.log("the pos", result)
        return result;
    }
    return Source;
}())
module.exports = Source;
