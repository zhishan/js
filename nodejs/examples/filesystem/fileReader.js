const fs = require('fs');

fs.readFile('/etc/passwd',"utf8",(err, data) => {
  if (err) throw err;
  console.log(data);
});