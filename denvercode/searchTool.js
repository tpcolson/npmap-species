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
		/* create the container and set it up a bit */
		control = this;
		var container = L.DomUtil.create('div', 'utk-search-tool'),
			contentPane = L.DomUtil.create('div', 'utk-search-pane'),
			stopPropagation = L.DomEvent.stopPropagation;
		this._container = container;

		container.id = 'searchTool';
		container.style.position = 'absolute';
		container.style.margin = '0px';
		container.style.width = window.getComputedStyle(document.getElementsByClassName('npmap-map-wrapper')[0]).getPropertyValue('width');
		L.DomEvent.disableClickPropagation(container); /* I don't want double-clicking on this to zoom the map */

		/* Load various GitHub resourses needed by this control */
		jQuery.ajax({
			type: 'GET',
			url: 'https://api.github.com/repos/nationalparkservice/npmap-species/contents/atbirecords/lexical_index.json',
			dataType: 'json',
			success: function(data) {
				var contents = window.atob(data.content),
					index = jQuery.parseJSON(contents)['items'],
					options = {
						keys: ['latin_name_ref', 'common_name'],
						threshold: 0.5
					}

				control._fuser = new Fuse(index, options);
			}
		});

		/* We need to move the top left controls down the page */
		document.getElementsByClassName('leaflet-control-home')[0].id = 'home';
		document.getElementsByClassName('leaflet-control-zoom')[0].id = 'zoom';
		document.getElementsByClassName('npmap-control-measure')[0].id = 'measure';
		document.getElementById('home').style.top = '225px';
		document.getElementById('zoom').style.top = '225px';
		document.getElementById('measure').style.top = '225px';

		/* top of container, never changes */
		var header = L.DomUtil.create('div', 'utk-search-header');
		var filler = L.DomUtil.create('p', 'utk-search-filler');
		var close = L.DomUtil.create('button', 'utk-search-close');

		close.innerHTML = '<b>X</b>';
		close.onclick = function() {
			if(control._selected === 'searchButton') {
				control._expandSearch('searchButton');
			} else {
				control._expandSearch('settingsButton');
			}
		}

		/* stupid css is getting overwritten, take this! */
		filler.style.margin = '0px';
		close.style.margin = '0px';
		close.style.border = '0px';
		close.style.padding = '0px';

		/* the header itself is added to the container in the _expandSearch function below */
		header.appendChild(filler);
		header.appendChild(close);

		/* the contentPane will hold the actual searching/setting functionalities */
		contentPane.style.left = parseInt((parseInt(window.getComputedStyle(document.getElementsByClassName('npmap-map-wrapper')[0]).getPropertyValue('width')) - 684) / 2) + 'px';
		container.appendChild(contentPane);

		/* create the settings tab (change base layer, check scale info, etc.) */
		this._createOptionsDiv(control);

		/* create search view (for now, this is just a static page) */
		this._createSearchDiv(control);

		/* create the expand tabs (choose setting or search view in control) */
		this._createExpandButtons(control);

		this._header = header;
		this._contentPane = contentPane;
		this._filler = filler;
		this._close = close;
		this._fullscreen = false;

		return container;
	},
	_createOptionsDiv: function(control) {
		var optionsDiv = L.DomUtil.create('div', 'utk-search-options');

		var layerOptions = L.DomUtil.create('div', 'utk-search-layer');
		var layerSwitcherLabel = L.DomUtil.create('div', 'utk-search-switcher-label');
		var layerSwitcher = L.DomUtil.create('select', 'utk-search-switcher');
		var observationSwitcher = L.DomUtil.create('div', 'observation-checkbox');
		var levelLabel = L.DomUtil.create('div', 'utk-search-level-label');
		var levelView = L.DomUtil.create('div', 'utk-search-level-view');

		layerSwitcherLabel.innerHTML = '<b>CHANGE MAP BACKGROUND</b>';
		layerSwitcherLabel.style.color = '#f5faf2';
		layerSwitcher.innerHTML = '<option>Mapbox Terrain</option>' +
			'<option>Park Tiles</option>' +
			'<option>Esri Topo</option>' +
			'<option>Esri Imagery</option>';
		control._lastBaseIndex = 0;
		layerSwitcher.onchange = function() {
			/* remove last layer (taken from NPMap.js switcher.js) */
			NPMap.config.baseLayers[control._lastBaseIndex].visible = false;
			NPMap.config.L.removeLayer(NPMap.config.baseLayers[control._lastBaseIndex].L);

			/* add new layer (taken from NPMap.js switcher.js) */
			var newLayer = NPMap.config.baseLayers[this.selectedIndex];
			if (newLayer.type === 'arcgisserver') {
				newLayer.L = L.npmap.layer[newLayer.type][newLayer.tiled === true ? 'tiled' : 'dynamic'](newLayer);
			} else {
				newLayer.L = L.npmap.layer[newLayer.type](newLayer);
			}
			newLayer.visible = true;
			NPMap.config.L.addLayer(newLayer.L);

			for(var i = 0; i < control._selectedSpecies.length; i++) {
				L.npmap.layer.mapbox({
					name: control._selectedSpecies[i],
					opacity: 0.5,
					id: 'nps.GRSM_' + control._selectedSpecies[i] + '_colored'
				}).addTo(NPMap.config.L);
			}

			control._lastBaseIndex = this.selectedIndex;
		}
		observationSwitcher.innerHTML = '<input type="checkbox" name="trails" value="trails"></input><label for="trails"> View Observed Sightings</label>';
		observationSwitcher.onchange = function() {
			control._toggleObservations();
		}
		levelLabel.innerHTML = '<i>CURRENT VIEW:</i>';
		levelLabel.style.color = '#f5faf2';
		levelLabel.style.fontWeight = '600';
		levelView.innerHTML = '<i>124.3m level 10: ?m resolution data</i>'; //todo: add data resolution
		levelView.style.color = '#f5faf2';
		levelView.style.fontWeight = '600';

		layerOptions.appendChild(layerSwitcherLabel);
		layerOptions.appendChild(layerSwitcher);
		layerOptions.appendChild(document.createElement('br'));
		layerOptions.appendChild(observationSwitcher);
		layerOptions.appendChild(levelLabel);
		layerOptions.appendChild(levelView);
		optionsDiv.appendChild(layerOptions);

		var poiDiv = L.DomUtil.create('div', 'utk-search-poi');

		var poiLabel = L.DomUtil.create('div', 'utk-search-poi-label');
		poiLabel.style.color = '#f5faf2';
		var poiCheckboxes = L.DomUtil.create('ul', 'utk-search-poi-checkboxes');

		var poiList = [
			'Trails',
			'Shelters',
			'Roads'
		];
		poiLabel.innerHTML = '<b>SELECT POINTS OF INTEREST</b>';
		poiCheckboxes.innerHTML = '<li style="margin: 10px 0px 10px 0px; padding: 0px; width: 35%"><input type="checkbox" name="trails" value="Trails" onchange="control._togglePOI(this);"></input><label for="trails"> Trails</label></li>' +
									'<li style="margin: 10px 0px 10px 0px; padding: 0px; width: 52%"><input type="checkbox" name="visitors" value="visitors" onchange="control._togglePOI(this);" disabled></input><label for="visitors"> Visitor Centers</label></li>' + //todo: add this layer
									'<li style="margin: 10px 0px 10px 0px; padding: 0px; width: 35%"><input type="checkbox" name="shelters" value="Shelters" onchange="control._togglePOI(this);"></input><label for="shelters"> Shelters</label></li>' +
									'<li style="margin: 10px 0px 10px 0px; padding: 0px; width: 50%"><input type="checkbox" name="roads" value="Roads" onchange="control._togglePOI(this);"></input><label for="roads"> Roads</label></li>' +
									'<li style="margin: 10px 0px 10px 0px; padding: 0px; width: 80%"><input type="checkbox" name="campsites" value="campsites" onchange="control._togglePOI(this);" disabled></input><label for="campsites"> Back Country Campsites</label></li>'; //todo: add this layer

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

		control._optionsDiv = optionsDiv;
		control._layerOptions = layerOptions;
		control._layerSwitcherLabel = layerSwitcherLabel;
		control._layerSwitcher = layerSwitcher;
		control._observationSwitcher = observationSwitcher;
		control._showObservations = false;
		control._levelLabel = levelLabel;
		control._levelView = levelView;
		control._poiDiv = poiDiv;
		control._poiLabel = poiLabel;
		control._poiCheckboxes = poiCheckboxes;
		control._annotationDiv = annotationDiv;
		control._annotationLabel= annotationLabel;
		control._annotationTools = annotationTools;
	},
	_createSearchDiv: function(control) {
		var searchDiv = L.DomUtil.create('div', 'utk-search-div');
		control._searchDiv = searchDiv;

		/* add breadcrumb to search div todo: make this dynamic */
		var breadcrumb = L.DomUtil.create('div', 'utk-search-breadcrumb');
		breadcrumb.innerHTML = 'SEARCH';
		searchDiv.appendChild(breadcrumb);

		/* create initial search page */
		control._createInitialSearch(control);

		/* create lexical/area search results page */
		control._createSearchResults(control);

		/* create group search results */
		control._createGroupResults(control);

		/* create default comparison page */
		control._createComparePage(control);

		/* create distribution comparison */
		control._createDistributionDiv(control);

		/* create environmental page */
		control._createEnvironmentDiv(control);

		/* create lexical compare page */
		control._createLexicalDiv(control);

		/* create area compare page */
		control._createAreaCompareDiv(control);

		/* create name type switcher */
		control._createNameSwitcher(control);

		control._breadcrumb = breadcrumb;
		control._lastSearchPage = control._initialSearchDiv;
		control._selectedSpecies = [];
		control._whichName = 'latin';
	},
	_createInitialSearch: function(control) {
		var initialSearchDiv = L.DomUtil.create('div', 'utk-search-initial');

		var initialSearchLexical = L.DomUtil.create('div', 'utk-search-init-lexical');
		var initialSearchLexLabel = L.DomUtil.create('div', 'init-lexical-label');
		initialSearchLexLabel.innerHTML = 'SEARCH BY NAME';
		var initialSearchLexBox = L.DomUtil.create('input', 'init-lexical-box');
		initialSearchLexBox.placeholder = 'Type a species name';
		initialSearchLexBox.oninput = function() {
			var evt = window.event;
			control._fuseSearch(evt.srcElement.value);
		}
		var resultsList = L.DomUtil.create('ul', 'init-lexical-results');
		resultsList.style.display = 'none';
		resultsList.style.margin = '0px';
		var initialSearchLexOptions = L.DomUtil.create('div', 'init-lexical-options');
		initialSearchLexOptions.innerHTML = '<input type="radio" name="lexicalType" value="species" checked /> SPECIES' +
									'<input type="radio" name="lexicalType" value="groups" style="margin-left:20px" /> GROUPS';

		initialSearchLexical.appendChild(initialSearchLexLabel);
		initialSearchLexical.appendChild(initialSearchLexBox);
		initialSearchLexical.appendChild(resultsList);
		initialSearchLexical.appendChild(initialSearchLexOptions);
		initialSearchDiv.appendChild(initialSearchLexical);

		var initialSearchArea = L.DomUtil.create('div', 'utk-search-init-area');
		var initialSearchAreaLabel = L.DomUtil.create('div', 'init-area-label');
		initialSearchAreaLabel.innerHTML = 'SEARCH BY SPECIFIC AREA ON MAP';
		var searchCircle = L.DomUtil.create('canvas', '');
		searchCircle.id = 'init-area-circle';
		searchCircle.width = 30;
		searchCircle.height = 30;
		var ctx = searchCircle.getContext('2d');
		ctx.beginPath();
		ctx.arc(15, 15, 15, 0, 2*Math.PI);
		ctx.strokeStyle = '#f5faf2';
		ctx.stroke();
		ctx.fillStyle = '#f5faf2';
		ctx.fill();
		var searchRectangle = L.DomUtil.create('canvas', '');
		searchRectangle.id = 'init-area-rect';
		searchRectangle.width = 30;
		searchRectangle.height = 30;
		var ctx = searchRectangle.getContext('2d');
		ctx.fillStyle = '#f5faf2';
		ctx.fillRect(0, 0, 30, 30);
		var radiusInput = L.DomUtil.create('div', 'init-area-radius');
		radiusInput.innerHTML = 'Set shape size: <input name="init-radius" value="0" size="10"/> m';

		initialSearchArea.appendChild(initialSearchAreaLabel);
		initialSearchArea.appendChild(searchCircle);
		initialSearchArea.appendChild(searchRectangle);
		initialSearchArea.appendChild(radiusInput);
		initialSearchDiv.appendChild(initialSearchArea);

		control._initialSearchDiv = initialSearchDiv;
		control._initialSearchLexical = initialSearchLexical;
		control._initialSearchLexLabel = initialSearchLexLabel;
		control._initialSearchLexBox = initialSearchLexBox;
		control._resultsList = resultsList;
		control._initialSearchLexOptions = initialSearchLexOptions;
		control._initialSearchArea = initialSearchArea;
		control._searchCircle = searchCircle;
		control._searchRectangle = searchRectangle;
		control._radiusInput = radiusInput;
	},
	_createSearchResults: function(control) {
		var comparisonPane = L.DomUtil.create('div', 'utk-search-compare');

		control._comparisonPane = comparisonPane;
	},
	_createGroupResults: function(control) {
	},
	_createComparePage: function(control) {
	},
	_createDistributionDiv: function(control) {
								/*
		var selectedImage = L.DomUtil.create('div', 'image-normal vignette');
		var innerImage = L.DomUtil.create('img', 'inner-image');
		innerImage.src = 'thumbnails/abies_fraseri.jpg';
		selectedImage.appendChild(innerImage);
		searchDiv.appendChild(selectedImage);

		var selectedSpecies = L.DomUtil.create('div', 'utk-search-species');
		selectedSpecies.innerHTML = 'Abies fraseri';
		searchDiv.appendChild(selectedSpecies);
		
		var selectedRadioButton = L.DomUtil.create('input', 'selected');
		selectedRadioButton.name = 'comparison';
		selectedRadioButton.type = 'radio';
		selectedRadioButton.checked = 'checked';
		searchDiv.appendChild(selectedRadioButton);

		var subheadCompare = L.DomUtil.create('div', 'subhead2');
		subheadCompare.innerHTML = 'COMPARE WITH ...';
		searchDiv.appendChild(subheadCompare);

		var subheadTitle = L.DomUtil.create('div', 'subhead');
		subheadTitle.innerHTML = 'SPECIES WITH SIMILAR DISTRIBUTION';
		searchDiv.appendChild(subheadTitle);

		var speciesText = L.DomUtil.create('div', 'description');
		speciesText.innerHTML = 'Distribution Characteristics: Spread over high elevation regions with a large amount of soil coverage. It\'s a fir tree!';
		searchDiv.appendChild(speciesText);

		var dropdown1 = L.DomUtil.create('select', 'compare-dropdown-1');
		dropdown1.innerHTML = '<option value=1><img width="43" height="21" src="thumbnails/abies_fraseri.jpg"></img> Abies fraseri</option>' +
								'<option value=2><img width="43" height="21" src="thumbnails/abies_fraseri.jpg"></img> Another abies fraseri</option>' +
								'<option value=3><img width="43" height="21" src="thumbnails/abies_fraseri.jpg"></img> Abies fraseri 3</option>' +
								'<option value=4><img width="43" height="21" src="thumbnails/abies_fraseri.jpg"></img> Something else</option>' +
								'<option value=5><img width="43" height="21" src="thumbnails/abies_fraseri.jpg"></img> Abies fraseri 4</option>';
		searchDiv.appendChild(dropdown1);

		var dropdown2 = L.DomUtil.create('select', 'compare-dropdown-2');
		dropdown2.innerHTML = '<option value=1><img width="43" height="21" src="thumbnails/abies_fraseri.jpg"></img> Abies fraseri</option>' +
								'<option value=2><img width="43" height="21" src="thumbnails/abies_fraseri.jpg"></img> Another abies fraseri</option>' +
								'<option value=3><img width="43" height="21" src="thumbnails/abies_fraseri.jpg"></img> Abies fraseri 3</option>' +
								'<option value=4><img width="43" height="21" src="thumbnails/abies_fraseri.jpg"></img> Something else</option>' +
								'<option value=5><img width="43" height="21" src="thumbnails/abies_fraseri.jpg"></img> Abies fraseri 4</option>';
		distributionDiv.appendChild(dropdown2);

		var numberResults = L.DomUtil.create('div', 'number-results');
		numberResults.innerHTML = '<i>5 RESULTS</i>';
		distributionDiv.appendChild(numberResults);

		var radioButton2 = L.DomUtil.create('input', 'radio-button-2');
		radioButton2.name = 'comparison';
		radioButton2.type = 'radio';
		distributionDiv.appendChild(radioButton2);

		var radioButton2Text = L.DomUtil.create('div', 'radio-button-2-text');
		radioButton2Text.innerHTML = '<center>COMPARE ENVIRONMENT</center>';
		distributionDiv.appendChild(radioButton2Text);

		var radioButton3 = L.DomUtil.create('input', 'radio-button-3');
		radioButton3.name = 'comparison';
		radioButton3.type = 'radio';
		distributionDiv.appendChild(radioButton3);

		var radioButton3Text = L.DomUtil.create('div', 'radio-button-3-text');
		radioButton3Text.innerHTML = '<center>COMPARE SPECIES</center>';
		distributionDiv.appendChild(radioButton3Text);

		var radioButton4 = L.DomUtil.create('input', 'radio-button-4');
		radioButton4.name = 'comparison';
		radioButton4.type = 'radio';
		distributionDiv.appendChild(radioButton4);

		var radioButton4Text = L.DomUtil.create('div', 'radio-button-4-text');
		radioButton4Text.innerHTML = '<center>COMPARE AREA</center>';
		distributionDiv.appendChild(radioButton4Text);

		control._distributionDiv = distributionDiv;
		control._selectedImage = selectedImage;
		control._innerImage = innerImage;
		control._selectedSpecies = selectedSpecies;
		control._selectedRadioButton = selectedRadioButton;
		control._subheadCompare = subheadCompare;
		control._subheadTitle = subheadTitle;
		control._speciesText = speciesText;
		control._dropdown1 = dropdown1;
		control._dropdown2 = dropdown2;
		control._numberResults = numberResults;
		control._radioButton2 = radioButton2;
		control._radioButton2Text = radioButton2Text;
		control._radioButton3 = radioButton3;
		control._radioButton3Text = radioButton3Text;
		control._radioButton4 = radioButton4;
		control._radioButton4Text = radioButton4Text;
		*/
	},
	_createEnvironmentDiv: function(control) {
	},
	_createLexicalDiv: function(control) {
	},
	_createAreaCompareDiv: function(control) {
	},
	_createNameSwitcher: function(control) {
		var nameSwitcherText = L.DomUtil.create('div', 'utk-name-switcher-text'),
			nameSwitcherButton = L.DomUtil.create('button', 'utk-name-switcher-button');

		nameSwitcherText.innerHTML = 'LATIN COMMON';
		nameSwitcherButton.onclick = function() {
			if(control._whichName === 'latin') {
				for(var i = 0; i < control._resultsList.children.length; i++) {
					var el = control._resultsList.children[i];
					el.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + el._common.replace('_', ' ');
				}

				control._whichName = 'common';
				jQuery('.utk-name-switcher-button').animate({'left': '1240px'});
			} else {
				for(var i = 0; i < control._resultsList.children.length; i++) {
					var el = control._resultsList.children[i];
					el.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + el._latin.replace('_', ' ');
				}

				control._whichName = 'latin';
				jQuery('.utk-name-switcher-button').animate({'left': '1302px'});
			}
		}

		control._searchDiv.appendChild(nameSwitcherText);
		control._searchDiv.appendChild(nameSwitcherButton);

		control._nameSwitcherText = nameSwitcherText;
		control._nameSwitcherButton = nameSwitcherButton;
	},
	_createExpandButtons: function(control) {
		var settingsButton = L.DomUtil.create('button', 'utk-tab-settings');
		var searchButton = L.DomUtil.create('button', 'utk-tab-search');
		settingsButton.id = 'settingsButton';
		settingsButton.onclick = function() {
			control._expandSearch('settingsButton');
		}
		settingsButton.innerHTML = '<img src="images/settingsButton.png"></img>';
		searchButton.id = 'searchButton';
		searchButton.onclick = function() {
			control._expandSearch('searchButton');
		}
		searchButton.innerHTML = '<img src="images/searchButton.png"></img>';

		control._container.appendChild(settingsButton);
		control._container.appendChild(searchButton);

		control._settingsButton = settingsButton;
		control._searchButton = searchButton;
		control._expanded = false;
		control._selected = '';
	},
	_expandSearch: function(whichTab) {
		if(control._expanded && whichTab === control._selected) {
			control._container.removeChild(control._header);
			control._contentPane.innerHTML = '';
			jQuery('#searchTool').animate({'height': '0px'});
			jQuery('#searchButton').animate({'top': '0px'});
			jQuery('#settingsButton').animate({'top': '0px'});
			jQuery('#searchButton').html('<img src="images/searchButton.png"></img>');
			jQuery('#settingsButton').html('<img src="images/settingsButton.png"></img>');
			control._expanded = false;
			control._selected = '';
		} else {
			if(whichTab === 'searchButton') {
				control._contentPane.innerHTML = '';
				control._container.insertBefore(control._header, control._contentPane);
				control._contentPane.appendChild(control._searchDiv);
				control._searchDiv.appendChild(control._lastSearchPage);
				control._searchDiv.removeChild(control._nameSwitcherText);
				control._searchDiv.removeChild(control._nameSwitcherButton);
				control._searchDiv.appendChild(control._nameSwitcherText);
				control._searchDiv.appendChild(control._nameSwitcherButton);
				jQuery('#searchButton').html('<img src="images/searchButtonSelected.png"></img>');
				jQuery('#settingsButton').html('<img src="images/settingsButton.png"></img>');
			} else {
				control._contentPane.innerHTML = '';
				control._container.insertBefore(control._header, control._contentPane);
				control._contentPane.appendChild(control._optionsDiv);
				jQuery('#settingsButton').html('<img src="images/settingsButtonSelected.png"></img>');
				jQuery('#searchButton').html('<img src="images/searchButton.png"></img>');
			}

			jQuery('#searchTool').animate({'height': '189px'});
			jQuery('#searchButton').animate({'top': '189px'});
			jQuery('#settingsButton').animate({'top': '189px'});
			control._expanded = true;
			control._selected = whichTab;
		}
	},
	_toggleObservations: function() {
		if(control._showObservations) {
			//todo: actually turn on and off observations
			control._showObservations = false;
		} else {
			//todo: actually turn on and off observations
			control._showObservations = true;
		}
	},
	_togglePOI: function(obj) {
		var layerName = obj.value;
		for(var i = 0; i < NPMap.config.overlays.length; i++) {
			var overlay = NPMap.config.overlays[i];
			if(overlay.name === layerName) {
				if(overlay.visible) {
					overlay.visible = false;
					NPMap.config.L.removeLayer(overlay.L);
				} else {
					overlay.visible = true;
					NPMap.config.L.addLayer(overlay.L);
				}
			}
		}
	},
	_fuseSearch: function(value) {
		var results = control._fuser.search(value);

		if(results.length > 0) {
			control._resultsList.style.display = 'block';
		} else {
			control._resultsList.style.display = 'none';
		}

		control._resultsList.innerHTML = '';
		for(var i = 0; i < results.length && i < 15; i++) {
			var li = L.DomUtil.create('li', 'search-result');
			if(control._whichName === 'latin') {
				li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + results[i].latin_name.replace('_', ' ');
			} else {
				li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + results[i].common_name.replace('_', ' ');
			}
			li._id = results[i].irma_id;
			li._latin = results[i].latin_name;
			li._common = results[i].common_name;
			li.style.margin = '0px';
			li.style.listStylePosition = 'inside';
			li.style.border = '1px solid black';
			li.style.color = '#f5faf2';
			li.style.letterSpacing = '.001em';
			li.style.fontSize = '12pt';
			li.style.lineHeight = '31px';
			li.style.cursor = 'pointer';
			li.onclick = function() {
				control._selectedSpecies.push(this._id);

				L.npmap.layer.mapbox({
					name: this._latin,
					opacity: 0.5,
					id: 'nps.GRSM_' + this._id
				}).addTo(NPMap.config.L);

				control._resultsList.style.display = 'none';
				control._resultsList.innerHTML = '';
				control._initialSearchLexBox.value = '';

				control._breadcrumb.innerHTML += ' > ' + this._latin.replace('_', ' ').toUpperCase();
				control._searchDiv.removeChild(control._initialSearchDiv);
				control._searchDiv.appendChild(control._comparisonPane);
				control._searchDiv.removeChild(control._nameSwitcherText);
				control._searchDiv.removeChild(control._nameSwitcherButton);
				control._searchDiv.appendChild(control._nameSwitcherText);
				control._searchDiv.appendChild(control._nameSwitcherButton);
				control._lastSearchPage = control._comparisonPane;
			}

			control._resultsList.appendChild(li);
		}
	}
});
