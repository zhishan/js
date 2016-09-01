const http = require('http');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
	var newFile = fs.createWriteStream("tmp.md");
	var fileBytes = req.headers['content-length'];
	var uploadedBytes = 0;
	req.pipe(newFile);

	req.on('data',function(chunk){
		uploadedBytes += chunk.length;
		var progress = (uploadedBytes /fileBytes) * 100;
		res.write("progress: " + parseInt(progress, 10) + "%n\n");
	});
	req.on('end', function(){
           res.statusCode = 200;
//           res.setHeader('Content-Type', 'text/plain');
           res.write('Hello World\n');
	   res.end('Success');
	});
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
// test
// curl --upload-file decoded_app_abnormal.zip http://127.0.0.1:3000/
