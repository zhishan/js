
var foo= function (str) {
	console.log('Foo:' + str);
}
var bar = function (str){
	console.log('Bar:%s', str);
}
var baz = function (str) {
	console.log('baz:%s',str);
}

/*
exports.foo = foo;
exports.bar = bar;
*/
module.exports = {
	foo,
	bar,
}
