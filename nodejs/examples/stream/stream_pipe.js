const fs = require('fs');
const rr = fs.createReadStream('foo.txt');
rr.on('readable', () => {
	  console.log('readable:', rr.read());
});
rr.on('end', () => {
	  console.log('end');
});
