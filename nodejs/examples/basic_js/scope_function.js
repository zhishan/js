(
 function b(){
	 if (a) {
		 a();
	 }else {
		 console.log("b");
		function a () { console.log("a");}
	 }
 }
 )();
