define([], function() {
function Control() {
	this.zoom = 6;
	this.whichName = 'common';
	this.list0Shown = false;
	this.showPredicted = true;
	this.showObserved = false;
	this.blendingActive = false;

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
	}
};

return Control;

});
