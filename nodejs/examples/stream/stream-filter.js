var filter = require("stream-filter");
 
process.stdin.pipe(filter.async(function(data, callback) {
 //   doAsyncThing(data, function(err, size) {
 //       callback(err, size > 2);
 //   });
   console.log(data);
})).pipe(process.stdout);
