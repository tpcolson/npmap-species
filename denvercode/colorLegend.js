var lastMouseLocation;
var floatationDevice;
var parent;

function addColorLegend() {
	parent = document.getElementById('main-map').getElementsByClassName('npmap')[0];

	floatationDevice = document.createElement('div');
	floatationDevice.id = 'color-legend';
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

	var header = document.createElement('div');
	header.style.width = '100%';
	header.style.height = '23px';
	header.style.borderBottom = '2px dotted #40403d';
	var header_center = document.createElement('center');
	header_center.innerHTML = 'COLOR LEGEND';
	header_center.style.lineHeight = '23px';
	header_center.style.letterSpacing = '.001em';
	header_center.style.color = '#909090';
	header.appendChild(header_center);
	floatationDevice.appendChild(header);

	var blue = document.createElement('div');
	blue.style.width = '100%';
	blue.style.height = '43px';
	blue.style.borderBottom = '2px dotted #40403d';
	var blue_center = document.createElement('center');
	blue_center.innerHTML = 'SPECIES 1';
	blue_center.style.height = '20px';
	blue_center.style.lineHeight = '20px';
	blue_center.style.letterSpacing = '.001em';
	blue_center.style.color = '#f5faf2';
	blue.appendChild(blue_center);
	var blue_color_center = document.createElement('center');
	blue_color_center.style.height = '20px';
	blue_color_center.style.position = 'absolute';
	blue_color_center.style.top = '45px';
	blue_color_center.style.left = '41px';
	blue_color_center.style.width = '100%';
	var blue_heavy = document.createElement('div');
	blue_heavy.style.width = '25%';
	blue_heavy.style.height = '100%';
	blue_heavy.style.float = 'left';
	blue_heavy.style.backgroundColor = '#283a95';
	blue_heavy.style.color = '#f5faf2';
	blue_heavy.style.lineHeight = '20px';
	blue_heavy.style.fontSize = '10pt';
	blue_heavy.innerHTML = '75-100%';
	var blue_medium = document.createElement('div');
	blue_medium.style.width = '25%';
	blue_medium.style.height = '100%';
	blue_medium.style.float = 'left';
	blue_medium.style.backgroundColor = '#2c7ebd';
	blue_medium.style.color = '#f5faf2';
	blue_medium.style.lineHeight = '20px';
	blue_medium.style.fontSize = '10pt';
	blue_medium.innerHTML = '50-75%';
	var blue_light = document.createElement('div');
	blue_light.style.width = '25%';
	blue_light.style.height = '100%';
	blue_light.style.float = 'left';
	blue_light.style.backgroundColor = '#40b5c6';
	blue_light.style.color = '#f5faf2';
	blue_light.style.lineHeight = '20px';
	blue_light.style.fontSize = '10pt';
	blue_light.innerHTML = '25-50%';
	blue_color_center.appendChild(blue_heavy);
	blue_color_center.appendChild(blue_medium);
	blue_color_center.appendChild(blue_light);
	blue.appendChild(blue_color_center);
	floatationDevice.appendChild(blue);

	var pink = document.createElement('div');
	pink.style.width = '100%';
	pink.style.height = '43px';
	pink.style.borderBottom = '2px dotted #40403d';
	var pink_center = document.createElement('center');
	pink_center.innerHTML = 'SPECIES 2';
	pink_center.style.height = '20px';
	pink_center.style.lineHeight = '20px';
	pink_center.style.letterSpacing = '.001em';
	pink_center.style.color = '#f5faf2';
	pink.appendChild(pink_center);
	var pink_color_center = document.createElement('center');
	pink_color_center.style.height = '20px';
	pink_color_center.style.position = 'absolute';
	pink_color_center.style.top = '90px';
	pink_color_center.style.left = '41px';
	pink_color_center.style.width = '100%';
	var pink_heavy = document.createElement('div');
	pink_heavy.style.width = '25%';
	pink_heavy.style.height = '100%';
	pink_heavy.style.float = 'left';
	pink_heavy.style.backgroundColor = '#752879';
	pink_heavy.style.color = '#f5faf2';
	pink_heavy.style.lineHeight = '20px';
	pink_heavy.style.fontSize = '10pt';
	pink_heavy.innerHTML = '75-100%';
	var pink_medium = document.createElement('div');
	pink_medium.style.width = '25%';
	pink_medium.style.height = '100%';
	pink_medium.style.float = 'left';
	pink_medium.style.backgroundColor = '#c31d8e';
	pink_medium.style.color = '#f5faf2';
	pink_medium.style.lineHeight = '20px';
	pink_medium.style.fontSize = '10pt';
	pink_medium.innerHTML = '50-75%';
	var pink_light = document.createElement('div');
	pink_light.style.width = '25%';
	pink_light.style.height = '100%';
	pink_light.style.float = 'left';
	pink_light.style.backgroundColor = '#f069a3';
	pink_light.style.color = '#f5faf2';
	pink_light.style.lineHeight = '20px';
	pink_light.style.fontSize = '10pt';
	pink_light.innerHTML = '25-50%';
	pink_color_center.appendChild(pink_heavy);
	pink_color_center.appendChild(pink_medium);
	pink_color_center.appendChild(pink_light);
	pink.appendChild(pink_color_center);
	floatationDevice.appendChild(pink);

	var orange = document.createElement('div');
	orange.style.width = '100%';
	orange.style.height = '43px';
	var orange_center = document.createElement('center');
	orange_center.innerHTML = 'SPECIES 3';
	orange_center.style.height = '20px';
	orange_center.style.lineHeight = '20px';
	orange_center.style.letterSpacing = '.001em';
	orange_center.style.color = '#f5faf2';
	orange.appendChild(orange_center);
	var orange_color_center = document.createElement('center');
	orange_color_center.style.height = '20px';
	orange_color_center.style.position = 'absolute';
	orange_color_center.style.top = '135px';
	orange_color_center.style.left = '41px';
	orange_color_center.style.width = '100%';
	var orange_heavy = document.createElement('div');
	orange_heavy.style.width = '25%';
	orange_heavy.style.height = '100%';
	orange_heavy.style.float = 'left';
	orange_heavy.style.backgroundColor = '#bd2026';
	orange_heavy.style.color = '#f5faf2';
	orange_heavy.style.lineHeight = '20px';
	orange_heavy.style.fontSize = '10pt';
	orange_heavy.innerHTML = '75-100%';
	var orange_medium = document.createElement('div');
	orange_medium.style.width = '25%';
	orange_medium.style.height = '100%';
	orange_medium.style.float = 'left';
	orange_medium.style.backgroundColor = '#f78e24';
	orange_medium.style.color = '#f5faf2';
	orange_medium.style.lineHeight = '20px';
	orange_medium.style.fontSize = '10pt';
	orange_medium.innerHTML = '50-75%';
	var orange_light = document.createElement('div');
	orange_light.style.width = '25%';
	orange_light.style.height = '100%';
	orange_light.style.float = 'left';
	orange_light.style.backgroundColor = '#ffce41';
	orange_light.style.color = '#f5faf2';
	orange_light.style.lineHeight = '20px';
	orange_light.style.fontSize = '10pt';
	orange_light.innerHTML = '25-50%';
	orange_color_center.appendChild(orange_heavy);
	orange_color_center.appendChild(orange_medium);
	orange_color_center.appendChild(orange_light);
	orange.appendChild(orange_color_center);
	floatationDevice.appendChild(orange);

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
