var subNavZ, headerZ, divHeader, divSubNav,
	fullscreen = false;

function enterfullscreen() {
	headerZ = divHeader.style.zIndex;
	subNavZ = divSubNav.style.zIndex;
	divHeader.style.zIndex = 0;
	divSubNav.style.zIndex = 0;
}

function exitfullscreen() {
	divHeader.style.zIndex = headerZ;
	divSubNav.style.zIndex = subNavZ;
}

function toggle() {
	if(fullscreen) {
		fullscreen = false;
		exitfullscreen();
	} else {
		fullscreen = true;
		enterfullscreen();
	}
}

window.onload = function() {
	divHeader = document.getElementById('header');
	divSubNav = document.getElementById('sub-nav');

	var fsButton = document.getElementsByClassName('fullscreen enter')[0];

	fsButton.addEventListener('click', toggle, false);
}
