define(['jquery', 'fuse'], function($, Fuse) {
return {
	prepareSearchTool: function(control) {
		var self = this;

		this.loadResource(
			'https://nationalparkservice.github.io/npmap-species/atbirecords/lexical_index.json', function(data) {
			var index = data.items,

			latinOptions = {
				keys: ['latin_name_ref'],
				threshold: 0.3
			},

			commonOptions = {
				keys: ['common_name'],
				threshold: 0.3
			};

			control.searchControl._latinFuser = new Fuse(index, latinOptions);
			control.searchControl._commonFuser = new Fuse(index, commonOptions);
		});

		self.loadResource('https://nationalparkservice.github.io/npmap-species/atbirecords/irma_mapping.json', function(data) {
			control.searchControl._nameMappings = data;
			delete control.searchControl._nameMappings[''];

			self.populateResults(control);
		});

		self.loadResource('https://nationalparkservice.github.io/npmap-species/atbirecords/most_similar_distribution.json', function(data) {
			control.searchControl._similarDistributions = data;
		});

		self.loadResource('https://nationalparkservice.github.io/npmap-species/atbirecords/species_auc.json', function(data) {
			control.searchControl._aucValues = data;
		});
	},

	loadResource: function(url, callback) {
		this.loadResourceWithTries(url, callback, 1);
	},

	loadResourceWithTries: function(url, callback, tries) {
		var loadResourceWithTries = this.loadResourceWithTries.bind(this);

		jQuery.ajax({
			type: 'GET',
			url: url,
			dataType: 'json',
			success: callback,
			error: function() {
				if(tries < 5)
					loadResourceWithTries(url, callback, tries+1);
			}
		});
	},

	establishEventListeners: function(control) {
		var self = this;

		$('#dropdown-initial-input').on('input', function(event, species) {
			self.fuseSearch(0, this.value, control);
		});

		$('.dropdown-button').on('keypress', function() {
			self.toggleSearchList(control, 0);
		}).on('click', function() {
			self.toggleSearchList(control, 0);
		});

		$('#search-initial-switch-button').on('keypress', function() {
			self.toggleName(control);
		}).on('click', function() {
			self.toggleName(control);
		});

		$('#link-gen-button').on('click', function() {
			var url = control.createURL();
			window.prompt('Copy to clipboard: Ctrl+C, Enter', url);
			$('#url_config').val(url);
		});
	},

	toggleSearchList: function(control, idx, callback) {
		if (idx === 0) {
			if(!control.list0Shown) {
				$('#search-initial-dropdown')
					.css({'border-radius':'4px 4px 0px 0px'});
				$('#search-initial-dropdown-lex').stop();
				$('#search-initial-dropdown-lex').animate({height: '0px'});
				$('#search-initial-dropdown-select').stop();
				$('#search-initial-dropdown-select')
					.animate({height: '400px'}, callback);
			} else {
				$('#search-initial-dropdown').css({'border-radius':'4px'});
				$('#search-initial-dropdown-select').stop();
				$('#search-initial-dropdown-select')
					.animate({height: '0px'}, callback);
			}
				control.list0Shown = !control.list0Shown;
		}
	},

	fuseSearch: function(idx, value, control, expand) {
		var commonResults = control.searchControl._commonFuser.search(value),
		latinResults = control.searchControl._latinFuser.search(value),
		results = (control.whichName === 'common') ? commonResults.slice(0, 15)
			: latinResults.slice(0, 15);

		var i, li;
		var self = this;

		/* replace unspecified names */
		if (control.whichName === 'common') {
			var j = 15;
			for(i = 0; i < results.length; i++) {
				if(results[i].common_name === 'Unspecified') {
					while(commonResults[j].common_name === 'Unspecified') {
						j++;
					}
					results[i] = commonResults[j];
					j++;
				}
			}
		}

		$('#search-initial-dropdown-select').stop();
		$('#search-initial-dropdown-select').animate({height: '0px'});
		elString = '#search-initial-dropdown-lex';
		$(elString).stop();

		if(expand === undefined || expand) {
			$(elString).animate({
				height: (results.length*21) + 'px'
			});
			$(elString).parent().css({'border-radius': '4px 4px 0px 0px'});
		} else {
			$(elString).animate({
				height: '0px'
			});
			$(elString).parent().css({'border-radius': '4px 4px 4px 4px'});
		}

		if(results.length === 0) {
			$(elString).parent().css({'border-radius': '4px 4px 4px 4px'});
			return;
		}


		document.getElementById(elString.substring(1)).innerHTML = '';
		for(i = 0; i < results.length; i++) {
			li = document.createElement('li');
			li._latin = results[i].latin_name;
			li._id = results[i].irma_id;
			li._common = results[i].common_name;
			li._idx = idx;

			if(control.whichName === 'common') {
				li.innerHTML = li._common.replace(/_/g, ' ');
				li.title = li._latin.replace(/_/g, ' ');
			} else {
				li.innerHTML = li._latin.replace(/_/g, ' ');
				li.title = li._common.replace(/_/g, ' ');
			}

			li.onclick = li.onkeypress = function() {
				self.fuseSearch(0, '', control, false);
				self.selectInitialSpecies(control, this);
			};

			document.getElementById(elString.substring(1)).appendChild(li);
		}

	},

	selectInitialSpecies: function(control, li) {
		document.getElementById('search-initial-dropdown').style
			.backgroundColor = 'rgb(202, 24, 146)';

		if(control.searchControl._selectedSpecies[0] !== undefined
			&& control.searchControl._selectedSpecies[0].visible) {

			if(control.showPredicted) {
				NPMap.config.L.removeLayer(control._selectedSpecies[0].predicted);
				console.debug("removign layer");
			}

			if(control.showObserved) {
				NPMap.config.L.removeLayer(control._selectedSpecies[0].observed);
				console.debug("removign layer");
			}
		}

		control.searchControl._selectedSpecies[0] = {};
		control.searchControl._selectedSpecies[0]._id = li._id;
		control.searchControl._selectedSpecies[0]._latin = li._latin;
		control.searchControl._selectedSpecies[0]._common = li._common;
		control.searchControl._selectedSpecies[0].visible = true;

		//control.searchControl._selectedSpecies[0].observed = createPopup(li);

		if(control.whichName === 'latin') {
			$('#search-initial-altname')
				.html(control.searchControl._selectedSpecies[0]._common
					.replace(/_/g, ' '));
			$('.dropdown-input', '#search-initial-dropdown')
				.val(control.searchControl._selectedSpecies[0]._latin
					.replace(/_/g, ' '));
		} else {
			$('#search-initial-altname')
				.html(control.searchControl._selectedSpecies[0]._latin
					.replace(/_/g, ' '));
			$('.dropdown-input', '#search-initial-dropdown')
				.val(control.searchControl._selectedSpecies[0]._common
					.replace(/_/g, ' '));
		}

		$('.dropdown-input', '#search-initial-dropdown')
			.css({'background-color': '#c91892'});

		control.drawData();

		if(control.showObserved) {
			control.searchControl._selectedSpecies[0].observed
				.addTo(NPMap.config.L);
		}

		//findAUC(0, li._latin);


		$('.subhead').css({
			color:'#f5faf2'
		});
		$('.subhead2').css({
			color:'#f5faf2',
		});

		$('input:radio[name=comparator]').prop('disabled', false);
		$('#search-initial-image').css({'opacity':1.0});

		//this.populateLists(control);

	},

	populateResults: function(control) {
		var keys = [];
		var commonKeys = [];
		var key, latin, common, id;
		var self = this;

		for(key in control.searchControl._nameMappings) {
			keys.push(key);
			commonKeys.push([control.searchControl._nameMappings[key].common, key]);
		}

		keys.sort();
		commonKeys.sort(function(a, b) {
			return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
		});

		document.getElementById('search-initial-dropdown-select')
			.innerHTML = '';
		var li = document.createElement('li');
		li.innerHTML = 'Clear selection';

		li.onclick = li.onkeypress = function() {
			self.toggleSearchList(control, 0);
			self.clearSearch(control);
		};

		document.getElementById('search-initial-dropdown-select')
			.appendChild(li);

		if(control.whichName === 'latin') {
			for(var i = 0; i < keys.length; i++) {
				latin = keys[i];
				common = control.searchControl._nameMappings[keys[i]].common;
				id = control.searchControl._nameMappings[keys[i]].id;

				li = document.createElement('li');
				li._latin = latin;
				li._id = id;
				li._common = common;

				if(control.whichName === 'latin') {
					li.innerHTML = li._latin.replace(/_/g, ' ');
					li.title = li._common.replace(/_/g, ' ');
				} else {
					li.innerHTML = li._common.replace(/_/g, ' ');
					li.title = li._latin.replace(/_/g, ' ');
				}

			li.onclick = li.onkeypress = function() {
				self.toggleSearchList(control, 0);
				self.selectInitialSpecies(control, this);
			};

			document.getElementById('search-initial-dropdown-select')
				.appendChild(li);
			}
		} else {
			for(var i = 0; i < commonKeys.length; i++) {
				latin = commonKeys[i][1];
				common = commonKeys[i][0];
				id = control.searchControl._nameMappings[latin].id;

				li = document.createElement('li');
				li._latin = latin;
				li._id = id;
				li._common = common;

				if(control.whichName === 'latin') {
					li.innerHTML = li._latin.replace(/_/g, ' ');
					li.title = li._common.replace(/_/g, ' ');
				} else {
					li.innerHTML = li._common.replace(/_/g, ' ');
					li.title = li._latin.replace(/_/g, ' ');
				}

				li.onclick = li.onkeypress = function() {
					self.toggleSearchList(control, 0);
					self.selectInitialSpecies(control, this);
				};

				document.getElementById('search-initial-dropdown-select')
					.appendChild(li);
			}
		}
	},

	clearSearch: function(control) {
		// remove all selected species
		document.getElementById('search-initial-dropdown').children[0]
			.innerHTML = '';
		document.getElementById('search-initial-dropdown').children[0]
			.title = '';
		document.getElementById('search-initial-dropdown').style
			.backgroundColor = '#40403d';

		$('.dropdown-input', '#search-initial-dropdown')
			.css({'background-color': '#40403d'});
		$('.dropdown-input', '#search-initial-dropdown').val('');

		for(var i = 0; i < control.searchControl._selectedSpecies.length; i++)
		{
			if(control.searchControl._selectedSpecies[i] !== undefined) {
				if(control.showPredicted) {
					NPMap.config.L.removeLayer(control.searchControl._selectedSpecies[i].predicted);
					console.log("Remove layers");
				}

				if(control.showObserved && i === 0) {
					NPMap.config.L.removeLayer(control.searchControl._selectedSpecies[i].observed);
					console.log("Remove layer 2");
				}
			}
		}

		control.searchControl._selectedSpecies = [];


		$('#search-initial-altname').html('');

		$('#search-compare-lexical').stop();
		$('#search-compare-lexical').animate({'width': '240px'});
		$('#search-compare-one-box').css({display:'none'});
		$('#search-compare-two-box').css({display:'none'});
		$('#search-compare-one-dropdown').css({display: 'none'});
		$('#search-compare-two-dropdown').css({display: 'none'});
		$('.subhead', '#search-compare-lexical').css({
			display:'block',
			color:'rgb(144, 144, 144)'
		});
		$('.subhead2', '#search-compare-lexical').css({
			top:'5px',
			fontSize:'14pt',
			color:'rgb(144, 144, 144)',
			width:'200px'
		});

		$('.subhead2', '#search-compare-lexical')
			.html('ANOTHER SPECIES IN THE PARK');

		$('#search-compare-distribution').stop();
		$('#search-compare-distribution').animate({'width': '240px'});
		$('#compare-dist-one').css({display:'none'});
		$('#compare-dist-two').css({display:'none'});
		$('.subhead', '#search-compare-distribution').css({
			display:'block',
			color:'rgb(144, 144, 144)'
		});

		$('.subhead2', '#search-compare-distribution').css({
			top:'5px',
			fontSize:'14pt',
			color:'rgb(144, 144, 144)',
			width:'200px'
		});
		$('.subhead2', '#search-compare-distribution')
			.html('SPECIES WITH SIMILAR DISTRIBUTION');

		$('input:radio[name=comparator]').prop('checked', false);
		$('input:radio[name=comparator]').prop('disabled', true);

		$('#search-initial-image').css({'opacity':0.0});

		$('#color-legend').animate({height: '0px'});
	},

	toggleName: function(control) {
		if(control.whichName === 'common') {
			$('#search-initial-switch-button').children().stop();
			$('#search-initial-switch-button').children()
				.animate({left:'0px'});
			control.whichName = 'latin';
		} else {
			$('#search-initial-switch-button').children().stop();
			$('#search-initial-switch-button').children()
				.animate({left:'75px'});
			control.whichName = 'common';
		}

		this.populateResults(control);

		var tmp = $('.dropdown-input', '#search-initial-dropdown').val();
		$('.dropdown-input', '#search-initial-dropdown')
			.val($('#search-initial-altname').html());
		$('#search-initial-altname').html(tmp);

		var swapNeeded = $('#search-initial-dropdown')
			.css('backgroundColor') === 'rgb(202, 24, 146)';
	},
};
});
