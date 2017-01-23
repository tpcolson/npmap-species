require.config({
	baseUrl: '/static/js',
	paths: {
		jquery: 'vendor/jquery/dist/jquery',
		leaflet: 'vendor/leaflet/dist/leaflet',
	},

	shim: {
		leaflet: {
			exports: 'L',
			init: function() {
				return this.L.noConflict();
			}
		}
	}
});

require(['jquery'],
function ($) {
$(document).ready(function() {
	console.log("It works");
});
});
