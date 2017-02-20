define(['jquery', 'query', 'utils', 'mds_util'], function($, Query, Util, Mds_util) {
function Control() {
	this.zoom = 6;
	this.whichName = 'common';
	this.list0Shown = false;
	this.showPredicted = true;
	this.showObserved = false;
	this.blendingActive = false;
	this.mdsShow = true;


	this.searchControl = {
		_latinFuser: undefined,
		_commonFuser: undefined,
		_nameMappings: undefined,
		_commonToLatin: undefined,
		_similarDistributions: undefined,
		_simThreshold: 200,
		_simDistLength: undefined,
		_aucValues: undefined,
		_selectedSpecies: [],
		_lastPredictionState: true,
		_lastObservationState: false
	};
}

Control.prototype = {
	initialize: function() {
		var vars = Query.getURLVariables();
		var self = this;

		Object.keys(vars).forEach(function(key) {
			if (self.hasOwnProperty(key)) {
				self[key] = vars[key];
			}
		});

		/* Put this here for now */
		if (vars.mdsShow !== 'false' && ($(window).height() > 500 &&
			$(window).width()  > 500)) {

			if (vars.mdsTop)
				$('#mds-border').css('top', vars.mdsTop + '%');
			if (vars.mdsLeft)
				$('#mds-border').css('left', vars.mdsLeft + '%');

			$('#mds-border').css('display', 'block');
			Mds_util.run_mds();
		}

		if (vars.species) {
			var common_name = this.getCommonName(vars.species);
			var latin_name = vars.species;
			var id  = this.getId(vars.species);

			Util.selectInitialSpecies(this, {
				_id: id,
				_latin: latin_name ,
				_common: common_name
			});
		}

	},


	createURL: function() {
		/* Get the mds position */

		var position = $('#mds-border').position();
		var left = parseFloat((position.left / $(window).width() * 100).toFixed(2));
		var top = parseFloat((position.top / $(window).height() * 100).toFixed(2));

		options = {
			'mdsTop': top,
			'mdsLeft': left
		};

		if (this.searchControl._selectedSpecies.length) {
			options.species = this.searchControl._selectedSpecies[0]._latin;
		}

		return Query.createURL(options);
	},

	drawData: function() {
		/* For now, hardcode for one species */

		var idx = 0;
		var color = '_pink';

		if(this.searchControl._selectedSpecies[idx] !== undefined) {
			if(this.showPredicted && this.searchControl._selectedSpecies[idx].visible) {
				try {
					NPMap.config.L
						.removeLayer(control._selectedSpecies[idx].predicted);
				} catch(e) {}
			}

			this.searchControl._selectedSpecies[idx].predicted = L.npmap.layer.mapbox({
				name: this.searchControl._selectedSpecies[idx]._latin,
				opacity: this.blendingActive ? 0.5 : 1,

				id: 'nps.GRSM_' + this.searchControl._selectedSpecies[idx]._id + color
			});

			if(this.showPredicted && this.searchControl._selectedSpecies[idx].visible) {
				this.searchControl._selectedSpecies[idx].predicted.addTo(NPMap.config.L);
			}
		}
	},

	getCommonName: function(latin_name) {
		try {
			return this.searchControl._nameMappings[latin_name].common;
		} catch (e) {
			return undefined;
		}
	},

	getId: function(latin_name) {
		try {
			return this.searchControl._nameMappings[latin_name].id;
		} catch(e) {
			return undefined;
		}
	}
};

return Control;

});
