var sub_nav_z, header_z, div_header, div_sub_nav,
	fullscreen = false;

function enterfullscreen() {
	header_z = div_header.style.zIndex;
	sub_nav_z = div_sub_nav.style.zIndex;
	div_header.style.zIndex = 0;
	div_sub_nav.style.zIndex = 0;
}

function exitfullscreen() {
	div_header.style.zIndex = header_z;
	div_sub_nav.style.zIndex = sub_nav_z;
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
	div_header = document.getElementById('header');
	div_sub_nav = document.getElementById('sub-nav');

	var fs_button = document.getElementsByClassName('fullscreen enter')[0];

	fs_button.addEventListener('click', toggle, false);
}
