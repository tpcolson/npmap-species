var control,
	ColorbarControl = L.Control.extend({
	options: {
		position: 'bottomright'
	},
	initialize: function(options) {
		L.Util.setOptions(this, options);
		return this;
	},
	onAdd: function(map) {
		control = this;
		var container = L.DomUtil.create('div', 'npmap-utk-colorbar'),
			stopPropagation = L.DomEvent.stopPropagation;

		this._header = L.DomUtil.create('h1', '', container);
		this._colorbar = L.DomUtil.create('p', '', container);

		//L.DomEvent.disableClickPropagation(this._button);
		//L.DomEvent
		//	.on(this._button, 'click', this._selectFirst)
		
		this._header.innerHTML = 'Probability of Presence';
		this._header.setAttribute('align', 'center');
		this._colorbar.innerHTML = '0.25 ' +
									'<svg height="20px" width="120px">' +
										'<rect height="20px" width="20px" x="0" fill="#bcbddc" />' +
										'<rect height="20px" width="20px" x="20" fill="#9e9ac8" />' +
										'<rect height="20px" width="20px" x="40" fill="#807dba" />' +
										'<rect height="20px" width="20px" x="60" fill="#6a51a3" />' +
										'<rect height="20px" width="20px" x="80" fill="#54278f" />' +
										'<rect height="20px" width="20px" x="100" fill="#3f007d" />' +
									'</svg>' +
									' 1.0';

		this._container = container;

		return container;
	},
	onRemove: function(map) {
	}
});
