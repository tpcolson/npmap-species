define(['jquery'], function($) {
return {

	/* Create URL with GET variables from options */
	createURL: function(options) {
		var url = window.location.href.split('?')[0];
		var queryString = '?';

		Object.keys(options).forEach(function(key) {
			queryString += (key + '=' + options[key] + '&');
		});

		/* Slice off either the last '&' char or the '?' char if not options */
		return url+queryString.slice(0, -1);
	},

	/* Return object with the GET variables */
	getURLVariables: function() {
		var options = {};
		var query = window.location.search.substring(1);
		var variables = query.split('&');
		variables.forEach(function(param) {
			var pair = param.split('=');
			if (pair[0] !== '' && pair[1] !== undefined)
				options[pair[0]] = pair[1];
		});

		return options;
	}

};

});
