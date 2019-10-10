/* PW protection 	
function trim(str) {
	return str.replace(/^\s+|\s+$/g, '');  
}

var pw_prompt = prompt('Bitte Passwort eingeben (Anfrage per E-Mail an: kay@tiroltrailhead.com), um auf die **ELBA TRAIL MAP** zu gelangen..',' ');
var pw = 'gimmegimme';
// if prompt is cancelled the pw_prompt var will be null!
if (pw_prompt == null) {
	alert('Kein Passwort wurde angegeben, **ELBA TRAIL MAP** wird nicht geladen...');
	if (bowser.msie) {
		document.execCommand('Stop');
	} else {
		window.stop();
	}
	window.location='http://tiroltrailhead.com/guiding';
}
if (trim(pw_prompt) == pw ) {
	alert('Passwort richtig!');
} else {
	alert('Falsches Passwort, **ELBA TRAIL MAP** wird nicht geladen..');
	if (bowser.msie) {
		document.execCommand('Stop');
	} else {
		window.stop();
	}
	window.location='http://tiroltrailhead.com/guiding';
}

*/