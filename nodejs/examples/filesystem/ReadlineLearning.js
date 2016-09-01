//https://nodejs.org/dist/latest-v6.x/docs/api/readline.html
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: fs.createReadStream('/etc/passwd')
});

rl.on('line', (line) => {
  console.log('Line from file:', line);
});