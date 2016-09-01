foo = (arr,b) => (arr.length < 1 ? [] : (b = arr[0], (arr.length < 2) ? arr : foo(arr.filter((a)=> a < b)).concat([b]).concat(foo(arr.filter((a) => a > b)))));
console.log(foo([1,5, 4, 3, 7, 5]));

