

var vacant = function (obj, opts) {
    opts = typeof opts !== 'undefined' ? opts : {};
    var visited = [];

    return is_vacant(obj, opts, visited);
}

var is_vacant = function (obj, opts, visited) {
    if (is_object(obj) ) {
        // walk recursively, avoiding circular references
        for (p in obj) {
            if (should_check(obj, p, opts, visited) ){
                if ( is_object(obj[p])) visited.push(obj[p]);
                if ( !is_vacant(obj[p], opts, visited) ){
                    return false;
                }
            }
        }
        return true;
    }
    else {
        return is_false(obj);
    }
}

var should_check = function (obj, property, opts, visited) {
    return obj.hasOwnProperty(property) && 
            !ignore_prop(property, opts) && 
            !has_visited(obj[property], visited);
}

var has_visited = function (obj, visited) {
    for (i = 0; i < visited.length; i += 1) {
        if (visited[i] === obj) {
            return true;
        }
    }
    return false;
}

var is_object = function (obj) {
    return (typeof obj === 'object' && 
         obj !== null &&
        !(obj instanceof Boolean) &&
        !(obj instanceof Date)    &&
        !(obj instanceof Number)  &&
        !(obj instanceof RegExp)  &&
        !(obj instanceof String)) ;
}

var is_false = function (thing) {
    if ( !thing ) return true;
    if ( typeof thing == 'string') {
        return thing.replace(/^\s+/, '').replace(/\s+$/, '') == '';
    }
    return false;
}


function ignore_prop(p, opts) {
    var regex = opts.ignore_props ? new RegExp(opts.ignore_props) : undefined;
    if ( regex ) {
        return regex.test(p);
    }
    else {
        return false;
    }
}


if (typeof module !== 'undefined') {
  module.exports = vacant;
}
