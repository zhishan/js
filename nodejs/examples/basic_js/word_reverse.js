bar = (str) => str.replace(/[\w ]+/, (s) => s.split(' ').reverse().map((w) => w.split('').reverse().join('')).join(' '))
console.log(bar('are you ok?'))
