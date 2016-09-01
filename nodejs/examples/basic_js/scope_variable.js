var a = 1;

function test(){
	console.log(a);
	if (a) {
		a();
	}
	//var a = 0;
	function a () { console.log("a");}
}

test()
