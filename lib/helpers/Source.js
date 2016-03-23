var Source = (function(){
    function Source ( value ) {
        this.value = value;
        this.computed = value;
        var start = 0;
        this.lines = this.value.split(/[\n\r]|\n\r/).map((value)=>{
            var obj = { value: value, start: start, end: start+value.length }
            start+=value.length;
            return obj;
        })
        this.cursor = 0;
        this.computedCursor = 0;
    }
    Source.prototype.slice = function slice ( pos ) {
        return { head: this.computed.slice(0,pos) , tail: this.computed.slice(pos, this.computed.length) };
    }
    Source.prototype.getCursor = function getCursor () {
        return this.cursor;
    }
    Source.prototype.setCursor = function setCursor ( value ) {
        this.cursor = parseInt(value);
        return this.cursor;
    }
    Source.prototype.replace = function replace ( pattern, replacement, advance ) {
        var parts = this.slice(this.computedCursor);
        var rpat = new RegExp("^"+pattern);
        if(!parts.tail.match(rpat)) return false;
        var match = rpat.exec(parts.tail);
        parts.tail = parts.tail.replace(rpat, replacement);
        var result = parts.head + parts.tail;
        if(advance){
            this.computedCursor += match.index + replacement.length;
            this.cursor += match.index + pattern.length;
        }

        this.computed = result;
        return result;
    }
    Source.prototype.getPos = function getPos ( index ) {
        var result;
        for( var k in this.lines ){
            var v = this.lines[k];
            if( index >= v.start && index <= v.end ) {
                var ndex = index - v.start;
                result = { line: parseInt(k)+1, column: ndex+1 }
                break;
            }
        };
        return result;
    }
    return Source;
}())
module.exports = Source;
