var control,
	SearchTool = L.Control.extend({
	options: {
		position: 'topleft'
	},
	initialize: function(options) {
		L.Util.setOptions(this, options);
		return this;
	},
	onAdd: function(map) {
		control = this;
		var container = L.DomUtil.create('div', 'utk-search-tool'),
			stopPropagation = L.DomEvent.stopPropagation;

		container.style.position = 'absolute';
		container.style.margin = '0px';

		var header = L.DomUtil.create('div', 'utk-search-header');
		var filler = L.DomUtil.create('p', 'utk-search-filler');
		var close = L.DomUtil.create('button', 'utk-search-close');

		L.DomEvent.disableClickPropagation(container);

		close.innerHTML = '<b>X</b>';

		filler.style.margin = '0px';
		close.style.margin = '0px';
		close.style.border = '0px';
		close.style.padding = '0px';

		header.appendChild(filler);
		header.appendChild(close);

		container.appendChild(header);

		var optionsDiv = L.DomUtil.create('div', 'utk-search-options');

		var layerOptions = L.DomUtil.create('div', 'utk-search-layer');
		var layerSwitcherLabel = L.DomUtil.create('div', 'utk-search-switcher-label');
		var layerSwitcher = L.DomUtil.create('select', 'utk-search-switcher');
		var levelLabel = L.DomUtil.create('div', 'utk-search-level-label');
		var levelView = L.DomUtil.create('div', 'utk-search-level-view');

		layerSwitcherLabel.innerHTML = '<b>CHANGE MAP BACKGROUND</b>';
		layerSwitcherLabel.style.color = '#f5faf2';
		layerSwitcher.innerHTML = '<option>Mapbox Terrain</option>' +
			'<option>Park Tiles</option>' +
			'<option>Esri Topo</option>' +
			'<option>Esri Imagery</option>';
		levelLabel.innerHTML = '<i>CURRENT VIEW:</i>';
		levelLabel.style.color = '#f5faf2';
		levelLabel.style.fontWeight = '600';
		levelView.innerHTML = '<i>700m level 6: 30m resolution data</i>';
		levelView.style.color = '#f5faf2';
		levelView.style.fontWeight = '600';

		layerOptions.appendChild(layerSwitcherLabel);
		layerOptions.appendChild(layerSwitcher);
		layerOptions.appendChild(document.createElement('br'));
		layerOptions.appendChild(document.createElement('br'));
		layerOptions.appendChild(levelLabel);
		layerOptions.appendChild(levelView);
		optionsDiv.appendChild(layerOptions);

		var poiDiv = L.DomUtil.create('div', 'utk-search-poi');

		var poiLabel = L.DomUtil.create('div', 'utk-search-poi-label');
		poiLabel.style.color = '#f5faf2';
		var poiCheckboxes = L.DomUtil.create('ul', 'utk-search-poi-checkboxes');

		poiLabel.innerHTML = '<b>SELECT POINTS OF INTEREST</b>';
		poiCheckboxes.innerHTML = '<li><input type="checkbox" name="trails" value="trails"></input><label for="trails"><i> Trails</i></label></li>' +
									'<li><input type="checkbox" name="roads" value="roads"></input><label for="roads"><i> Roads</i></label></li>' +
									'<li><input type="checkbox" name="shelters" value="shelters"></input><label for="shelters"><i> Shelters</i></label></li>' +
									'<li><input type="checkbox" name="restrooms" value="restrooms"></input><label for="restrooms"><i> Restrooms</i></label></li>' +
									'<li><input type="checkbox" name="campsites" value="campsites"></input><label for="campsites"><i> Campsites</i></label></li>' +
									'<li><input type="checkbox" name="visitors" value="visitors"></input><label for="visitors"><i> Visitor Centers</i></label></li>';

		poiDiv.appendChild(poiLabel);
		poiDiv.appendChild(poiCheckboxes);
		optionsDiv.appendChild(poiDiv);

		var annotationDiv = L.DomUtil.create('div', 'utk-search-annotation');

		var annotationLabel = L.DomUtil.create('div', 'utk-search-annotation-label');
		annotationLabel.innerHTML = '<b>ANNOTATE MAP</b>';
		annotationLabel.style.color = '#f5faf2';
		var annotationTools = L.DomUtil.create('div', 'utk-search-annotation-tools');
		annotationTools.innerHTML = '<button class="marker"></button>' +
									'<button class="polyline"></button>' +
									'<button class="polygon"></button>' +
									'<button class="rectangle"></button>' +
									'<button class="circle"></button>';

		annotationDiv.appendChild(annotationLabel);
		annotationDiv.appendChild(annotationTools);
		optionsDiv.appendChild(annotationDiv);

		container.appendChild(optionsDiv);

		this._container = container;
		this._header = header;
		this._filler = filler;
		this._close = close;
		this._optionsDiv = optionsDiv;
		this._layerOptions = layerOptions;
		this._layerSwitcherLabel = layerSwitcherLabel;
		this._layerSwitcher = layerSwitcher;
		this._levelLabel = levelLabel;
		this._levelView = levelView;
		this._poiDiv = poiDiv;
		this._poiLabel = poiLabel;
		this._poiCheckboxes = poiCheckboxes;
		this._annotationDiv = annotationDiv;
		this._annotationLabel= annotationLabel;
		this._annotationTools = annotationTools;

		return container;
	}
});
