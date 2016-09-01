var filter = require("stream-filter");
 
process.stdin.pipe(filter(function(data) {
	    return data.length > 2;
})).pipe(process.stdout);
