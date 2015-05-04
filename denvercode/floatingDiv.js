var lastMouseLocation;
var floatationDevice;
var parent;

function addFloatationDevice() {
	parent = document.getElementById('main-map').getElementsByClassName('npmap')[0];

	floatationDevice = document.createElement('div');
	floatationDevice.id = 'floatDiv';
	floatationDevice.style.cursor = 'move';

	floatationDevice.onmousedown = function(evt) {
		var e = evt || window.event;
		e.preventDefault();

		var posX = e.clientX;
		var posY = e.clientY;

		lastMouseLocation = [ posX, posY ];

		floatationDevice.addEventListener('mousemove', moveDiv, false);
		floatationDevice.style.cursor = 'move';
	}

	floatationDevice.onmouseup = function() {
		floatationDevice.removeEventListener('mousemove', moveDiv);
		floatationDevice.style.cursor = 'move';
	}

	var pad = document.createElement('div');
	pad.style.width = '100%';
	pad.style.height = '25px';
	floatationDevice.appendChild(pad);

	var center_button = document.createElement('center');
	var button = document.createElement('button');
	button.innerHTML = 'Click me!';
	center_button.appendChild(button);
	floatationDevice.appendChild(center_button);

	parent.appendChild(floatationDevice);
}

function moveDiv(evt) {
	var e = evt || window.event;

	var posX = e.clientX;
	var posY = e.clientY;

	var diffX = posX - lastMouseLocation[0];
	var diffY = posY - lastMouseLocation[1];

	var left = window.getComputedStyle(floatationDevice).getPropertyValue('left');
	var top = window.getComputedStyle(floatationDevice).getPropertyValue('top');

	if(parseInt(left) + diffX >= 0) {
		var parWidth = window.getComputedStyle(parent).getPropertyValue('width');
		var divWidth = window.getComputedStyle(floatationDevice).getPropertyValue('width');

		if(parseInt(left) + diffX <= parseInt(parWidth) - parseInt(divWidth)) {
			floatationDevice.style.left = (parseInt(left) + diffX) + 'px';
		} else {
			floatationDevice.style.left = (parseInt(parWidth) - parseInt(divWidth)) + 'px';
		}
	} else {
		floatationDevice.style.left = '0px';
	}
	if(parseInt(top) + diffY >= 0) {
		var parHeight = window.getComputedStyle(parent).getPropertyValue('height');
		var divHeight = window.getComputedStyle(floatationDevice).getPropertyValue('height');

		if(parseInt(top) + diffY <= parseInt(parHeight) - parseInt(divHeight)) {
			floatationDevice.style.top = (parseInt(top) + diffY) + 'px';
		} else {
			floatationDevice.style.top = (parseInt(parHeight) - parseInt(divHeight)) + 'px';
		}
	} else {
		floatationDevice.style.top = '0px';
	}

	lastMouseLocation = [ posX, posY ];
}
