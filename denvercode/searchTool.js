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
		this._resourcesReady = [
			false, // lexical index
			false, // name mappings
			false, // distribution index
			false  // environment index
		];

		loadResource('http://nationalparkservice.github.io/npmap-species/atbirecords/lexical_index.json', function(data) {
			var index = data.items,
				latinOptions = {
					keys: ['latin_name_ref'],
					threshold: 0.5
				},
				commonOptions = {
					keys: ['common_name'],
					threshold: 0.5
				}

			control._latinFuser = new Fuse(index, latinOptions);
			control._commonFuser = new Fuse(index, commonOptions);

			tryEnableSearch(0);
		});

		loadResource('http://nationalparkservice.github.io/npmap-species/atbirecords/irma_mapping.json', function(data) {
			control._nameMappings = data;

		tryEnableSearch(1);
		});

		loadResource('http://nationalparkservice.github.io/npmap-species/atbirecords/most_similar_distribution.json', function(data) {
			control._similarDistributions = data;

			tryEnableSearch(2);
		});

		loadResource('http://nationalparkservice.github.io/npmap-species/atbirecords/most_similar_environment.json', function(data) {
			control._similarEnvironments = data;

			tryEnableSearch(3);
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
					id: 'nps.GRSM_' + control._selectedSpecies[i].id
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
		levelView.innerHTML = '<i>level 10: 124.3m per pixel</i>'; //todo: add data resolution
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
		poiLabel.innerHTML = '<b>SELECT MAP LAYERS</b>';
		poiCheckboxes.innerHTML = '<li style="margin: 10px 0px 10px 0px; padding: 0px; width: 35%"><input type="checkbox" name="trails" value="Trails" onchange="control._togglePOI(this);"></input><label for="trails"> Trails</label></li>' +
									'<li style="margin: 10px 0px 10px 0px; padding: 0px; width: 52%"><input type="checkbox" name="Visitor Centers" value="Visitor Centers" onchange="control._togglePOI(this);"></input><label for="visitors"> Visitor Centers</label></li>' + //todo: add this layer
									'<li style="margin: 10px 0px 10px 0px; padding: 0px; width: 35%"><input type="checkbox" name="shelters" value="Shelters" onchange="control._togglePOI(this);"></input><label for="shelters"> Shelters</label></li>' +
									'<li style="margin: 10px 0px 10px 0px; padding: 0px; width: 50%"><input type="checkbox" name="roads" value="Roads" onchange="control._togglePOI(this);"></input><label for="roads"> Roads</label></li>' +
									'<li style="margin: 10px 0px 10px 0px; padding: 0px; width: 80%"><input type="checkbox" name="Campsites" value="Campsites" onchange="control._togglePOI(this);"></input><label for="campsites"> Back Country Campsites</label></li>'; //todo: add this layer

		poiDiv.appendChild(poiLabel);
		poiDiv.appendChild(poiCheckboxes);
		optionsDiv.appendChild(poiDiv);

		var annotationDiv = L.DomUtil.create('div', 'utk-search-annotation');

		var annotationLabel = L.DomUtil.create('div', 'utk-search-annotation-label');
		annotationLabel.innerHTML = '<b>ANNOTATE MAP</b>';
		annotationLabel.style.color = '#f5faf2';

		annotationDiv.appendChild(annotationLabel);
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
	},
	_createSearchDiv: function(control) {
		var searchDiv = L.DomUtil.create('div', 'utk-search-div');
		control._searchDiv = searchDiv;

		/* add breadcrumb to search div todo: make this dynamic */
		var breadcrumb = L.DomUtil.create('div', 'utk-search-breadcrumb');
		var breadcrumbBase = L.DomUtil.create('div', '');
		breadcrumbBase.style.display = 'inline-block';
		breadcrumbBase.style.float = 'left';
		breadcrumbBase.style.marginRight = '5px';
		breadcrumbBase.innerHTML = 'SEARCH';
		breadcrumbBase.style.cursor = 'pointer';
		breadcrumbBase.onclick = function() {
			for(var i = 1; i < control._searchDiv.children.length; i++) {
				control._searchDiv.children[i--].remove();
			}
			control._lastSearchPage = control._initialSearchDiv;
			control._searchDiv.appendChild(control._initialSearchDiv);

			for(var i = 1; i < control._breadcrumb.children.length; i++) {
				control._breadcrumb.children[i--].remove();
			}

			for(var i = 0; i < control._selectedSpecies.length; i++) {
				if(control._selectedSpecies[i] !== undefined) {
					NPMap.config.L.removeLayer(control._selectedSpecies[i]);

					if(control._showObservations) {
						NPMap.config.L.removeLayer(control._speciesSightings[i]);
					}

					control._selectedSpecies[i] = undefined;
				}
			}

			control._searchDiv.appendChild(control._nameSwitcherText);
			control._searchDiv.appendChild(control._nameSwitcherButton);
		}
		breadcrumb.appendChild(breadcrumbBase);
		searchDiv.appendChild(breadcrumb);

		/* create initial search page */
		control._createInitialSearch(control);

		/* create lexical/area search results page */
		control._createSearchResults(control);

		/* create name type switcher */
		control._createNameSwitcher(control);

		control._breadcrumb = breadcrumb;
		control._breadcrumbBase = breadcrumbBase;
		control._lastSearchPage = control._initialSearchDiv;
		control._selectedSpecies = [];
		control._speciesSightings = [];
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
			control._fuseSearch(evt.srcElement.value, resultsList, 0);
		}
		var resultsList = L.DomUtil.create('ul', 'init-lexical-results');
		resultsList.style.display = 'none';
		resultsList.style.margin = '0px';

		initialSearchLexical.appendChild(initialSearchLexLabel);
		initialSearchLexical.appendChild(initialSearchLexBox);
		initialSearchLexical.appendChild(resultsList);
		initialSearchDiv.appendChild(initialSearchLexical);

		control._initialSearchDiv = initialSearchDiv;
		control._initialSearchLexical = initialSearchLexical;
		control._initialSearchLexLabel = initialSearchLexLabel;
		control._initialSearchLexBox = initialSearchLexBox;
		control._resultsList = resultsList;
	},
	_createSearchResults: function(control) {
		var comparisonPane = L.DomUtil.create('div', 'utk-search-compare');

		var comparisonPaneImage = L.DomUtil.create('div', 'image-normal vignette');
		comparisonPaneImage.onmouseover = function() {
			control._comparisonDistributionPane.style.zIndex = -2;
			control._comparisonEnvironmentPane.style.zIndex = -2;
			document.getElementById('searchButton').style.zIndex = -3;
			document.getElementById('settingsButton').style.zIndex = -3;
		}
		comparisonPaneImage.onmouseout = function() {
			setTimeout(function() {
				control._comparisonDistributionPane.style.zIndex = 1;
				control._comparisonEnvironmentPane.style.zIndex = 1;
				document.getElementById('searchButton').style.zIndex = 1;
				document.getElementById('settingsButton').style.zIndex = 1;
			}, 200);
		}
		var innerImage = L.DomUtil.create('img', 'inner-image');
		innerImage.src = 'images/abies_fraseri.jpg';
		comparisonPaneImage.appendChild(innerImage);
		comparisonPane.appendChild(comparisonPaneImage);

		var comparisonPaneSpecies = L.DomUtil.create('div', 'utk-search-species');
		comparisonPaneSpecies.innerHTML = '';
		comparisonPane.appendChild(comparisonPaneSpecies);

		var comparisonDistributionPane = L.DomUtil.create('div', 'compare-distribution');
		var distributionPaneLabelTop = L.DomUtil.create('div', 'subhead2');
		distributionPaneLabelTop.innerHTML = 'COMPARE WITH';
		distributionPaneLabelTop.style.position = 'absolute';
		distributionPaneLabelTop.style.top = '0px';
		distributionPaneLabelTop.style.left = '20px';
		var distributionPaneLabelMain = L.DomUtil.create('div', 'subhead');
		distributionPaneLabelMain.innerHTML = 'SPECIES WITH SIMILAR DISTRIBUTION';
		distributionPaneLabelMain.style.position = 'absolute';
		distributionPaneLabelMain.style.top = '25px';
		distributionPaneLabelMain.style.left = '20px';
		distributionPaneLabelMain.style.lineHeight = '25px';
		var distributionRadioButton = L.DomUtil.create('input', '');
		distributionRadioButton.type = 'radio';
		distributionRadioButton.name = 'which-pane';
		distributionRadioButton.value = 'distribution';
		distributionRadioButton.style.position = 'absolute';
		distributionRadioButton.style.top = '32px';
		distributionRadioButton.style.left = '0px';
		distributionRadioButton.onclick = function() {
			if(control._currentComparison !== 'distribution') {
				control._currentComparison = 'distribution';
				control._changeCompare('distribution');
			}
		}
		comparisonDistributionPane.appendChild(distributionPaneLabelTop);
		comparisonDistributionPane.appendChild(distributionPaneLabelMain);
		comparisonDistributionPane.appendChild(distributionRadioButton);

		var comparisonEnvironmentPane = L.DomUtil.create('div', 'compare-environment');
		var environmentPaneLabelTop = L.DomUtil.create('div', 'subhead2');
		environmentPaneLabelTop.innerHTML = 'COMPARE WITH';
		environmentPaneLabelTop.style.position = 'absolute';
		environmentPaneLabelTop.style.top = '0px';
		environmentPaneLabelTop.style.left = '20px';
		var environmentPaneLabelMain = L.DomUtil.create('div', 'subhead');
		environmentPaneLabelMain.innerHTML = 'SPECIES WITH SIMILAR ENVIRONMENT';
		environmentPaneLabelMain.style.position = 'absolute';
		environmentPaneLabelMain.style.top = '25px';
		environmentPaneLabelMain.style.left = '20px';
		environmentPaneLabelMain.style.lineHeight = '25px';
		var environmentRadioButton = L.DomUtil.create('input', '');
		environmentRadioButton.type = 'radio';
		environmentRadioButton.name = 'which-pane';
		environmentRadioButton.value = 'environment';
		environmentRadioButton.style.position = 'absolute';
		environmentRadioButton.style.top = '32px';
		environmentRadioButton.style.left = '0px';
		environmentRadioButton.onclick = function() {
			if(control._currentComparison !== 'environment') {
				control._currentComparison = 'environment';
				control._changeCompare('environment');
			}
		}
		comparisonEnvironmentPane.appendChild(environmentPaneLabelTop);
		comparisonEnvironmentPane.appendChild(environmentPaneLabelMain);
		comparisonEnvironmentPane.appendChild(environmentRadioButton);

		var comparisonLexicalPane = L.DomUtil.create('div', 'compare-lexical');
		var lexicalPaneLabelTop = L.DomUtil.create('div', 'subhead2');
		lexicalPaneLabelTop.innerHTML = 'COMPARE WITH';
		lexicalPaneLabelTop.style.position = 'absolute';
		lexicalPaneLabelTop.style.top = '0px';
		lexicalPaneLabelTop.style.left = '20px';
		var lexicalPaneLabelMain = L.DomUtil.create('div', 'subhead');
		lexicalPaneLabelMain.innerHTML = 'ANOTHER SPECIES IN THE PARK';
		lexicalPaneLabelMain.style.position = 'absolute';
		lexicalPaneLabelMain.style.top = '25px';
		lexicalPaneLabelMain.style.left = '20px';
		lexicalPaneLabelMain.style.lineHeight = '25px';
		lexicalPaneLabelMain.style.width = '200px';
		var lexicalRadioButton = L.DomUtil.create('input', '');
		lexicalRadioButton.type = 'radio';
		lexicalRadioButton.name = 'which-pane';
		lexicalRadioButton.value = 'lexical';
		lexicalRadioButton.style.position = 'absolute';
		lexicalRadioButton.style.top = '32px';
		lexicalRadioButton.style.left = '0px';
		lexicalRadioButton.onclick = function() {
			if(control._currentComparison !== 'lexical') {
				control._currentComparison = 'lexical';
				control._changeCompare('lexical');
			}
		}
		comparisonLexicalPane.appendChild(lexicalPaneLabelTop);
		comparisonLexicalPane.appendChild(lexicalPaneLabelMain);
		comparisonLexicalPane.appendChild(lexicalRadioButton);

		comparisonPane.appendChild(comparisonDistributionPane);
		comparisonPane.appendChild(comparisonEnvironmentPane);
		comparisonPane.appendChild(comparisonLexicalPane);

		control._comparisonPane = comparisonPane;
		control._comparisonPaneImage = comparisonPaneImage;
		control._innerImage = control._innerImage;
		control._comparisonPaneSpecies = comparisonPaneSpecies;
		control._comparisonDistributionPane = comparisonDistributionPane;
		control._distributionPaneLabelTop = distributionPaneLabelTop;
		control._distributionPaneLabelMain = distributionPaneLabelMain;
		control._distributionRadioButton = distributionRadioButton;
		control._comparisonEnvironmentPane = comparisonEnvironmentPane;
		control._environmentPaneLabelTop = environmentPaneLabelTop;
		control._environmentPaneLabelMain = environmentPaneLabelMain;
		control._environmentRadioButton = environmentRadioButton;
		control._comparisonLexicalPane = comparisonLexicalPane;
		control._lexicalPaneLabelTop = lexicalPaneLabelTop;
		control._lexicalPaneLabelMain = lexicalPaneLabelMain;
		control._lexicalRadioButton = lexicalRadioButton;
		control._currentComparison = '';
	},
	_createNameSwitcher: function(control) {
		var nameSwitcherText = L.DomUtil.create('div', 'utk-name-switcher-text'),
			nameSwitcherButton = L.DomUtil.create('button', 'utk-name-switcher-button');

		nameSwitcherText.innerHTML = 'LATIN COMMON';
		nameSwitcherButton.onclick = function() {
			if(control._whichName === 'latin') {
				for(var i = 0; i < control._resultsList.children.length; i++) {
					var el = control._resultsList.children[i];
					el.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + el._common.replace(/_/g, ' ');
				}

				if(control._breadcrumbSpecies !== undefined) {
					control._breadcrumbSpecies.innerHTML = '> ' + control._breadcrumbSpecies._common.replace(/_/g, ' ').toUpperCase();
				}

				if(control._distributionResultsListOne !== undefined) {
					if(control._whichCompare === 'distribution' && control._distributionDropdownOne._latin != '') {
						control._distributionDropdownOne.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._distributionDropdownOne._common.replace(/_/g, ' ');
						control._distributionDropdownOne.appendChild(dOneTriangle);
					}
					for(var i = 0; i < control._distributionResultsListOne.children.length; i++) {
						var el = control._distributionResultsListOne.children[i];
						el.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + el._common.replace(/_/g, ' ');
					}
				}

				if(control._distributionResultsListTwo !== undefined) {
					if(control._whichCompare === 'distribution' && control._distributionDropdownTwo._latin != '') {
						control._distributionDropdownTwo.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._distributionDropdownTwo._common.replace(/_/g, ' ');
						control._distributionDropdownTwo.appendChild(dTwoTriangle);
					}
					for(var i = 0; i < control._distributionResultsListTwo.children.length; i++) {
						var el = control._distributionResultsListTwo.children[i];
						el.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + el._common.replace(/_/g, ' ');
					}
				}

				if(control._environmentResultsListOne !== undefined) {
					if(control._whichCompare === 'environment' && control._environmentDropdownOne._latin != '') {
						control._environmentDropdownOne.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._environmentDropdownOne._common.replace(/_/g, ' ');
						control._environmentDropdownOne.appendChild(eOneTriangle);
					}
					for(var i = 0; i < control._environmentResultsListOne.children.length; i++) {
						var el = control._environmentResultsListOne.children[i];
						el.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + el._common.replace(/_/g, ' ');
					}
				}

				if(control._environmentResultsListTwo !== undefined) {
					if(control._whichCompare === 'environment' && control._environmentDropdownTwo._latin != '') {
						control._environmentDropdownTwo.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._environmentDropdownTwo._common.replace(/_/g, ' ');
						control._environmentDropdownTwo.appendChild(eTwoTriangle);
					}
					for(var i = 0; i < control._environmentResultsListTwo.children.length; i++) {
						var el = control._environmentResultsListTwo.children[i];
						el.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + el._common.replace(/_/g, ' ');
					}
				}

				control._whichName = 'common';
				jQuery('.utk-name-switcher-button').animate({'left': '1240px'});

				if(control._selectedSpeciesRef !== undefined) {
					control._comparisonPaneSpecies.innerHTML = control._selectedSpeciesRef._common.replace(/_/g, ' ');
				}
			} else {
				for(var i = 0; i < control._resultsList.children.length; i++) {
					var el = control._resultsList.children[i];
					el.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + el._latin.replace(/_/g, ' ');
				}

				if(control._breadcrumbSpecies !== undefined) {
					control._breadcrumbSpecies.innerHTML = '> ' + control._breadcrumbSpecies._latin.replace(/_/g, ' ').toUpperCase();
				}

				if(control._distributionResultsListOne !== undefined) {
					if(control._whichCompare === 'distribution' && control._distributionDropdownOne._common != '') {
						control._distributionDropdownOne.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._distributionDropdownOne._latin.replace(/_/g, ' ');
						control._distributionDropdownOne.appendChild(dOneTriangle);
					}
					for(var i = 0; i < control._distributionResultsListOne.children.length; i++) {
						var el = control._distributionResultsListOne.children[i];
						el.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + el._latin.replace(/_/g, ' ');
					}
				}

				if(control._distributionResultsListTwo !== undefined) {
					if(control._whichCompare === 'distribution' && control._distributionDropdownTwo._common != '') {
						control._distributionDropdownTwo.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._distributionDropdownTwo._latin.replace(/_/g, ' ');
						control._distributionDropdownTwo.appendChild(dTwoTriangle);
					}
					for(var i = 0; i < control._distributionResultsListTwo.children.length; i++) {
						var el = control._distributionResultsListTwo.children[i];
						el.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + el._latin.replace(/_/g, ' ');
					}
				}

				if(control._environmentResultsListOne !== undefined) {
					if(control._whichCompare === 'environment' && control._environmentDropdownOne._common != '') {
						control._environmentDropdownOne.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._environmentDropdownOne._latin.replace(/_/g, ' ');
						control._environmentDropdownOne.appendChild(eOneTriangle);
					}
					for(var i = 0; i < control._environmentResultsListOne.children.length; i++) {
						var el = control._environmentResultsListOne.children[i];
						el.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + el._latin.replace(/_/g, ' ');
					}
				}

				if(control._environmentResultsListTwo !== undefined) {
					if(control._whichCompare === 'environment' && control._environmentDropdownTwo._common != '') {
						control._environmentDropdownTwo.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._environmentDropdownTwo._latin.replace(/_/g, ' ');
						control._environmentDropdownTwo.appendChild(eTwoTriangle);
					}
					for(var i = 0; i < control._environmentResultsListTwo.children.length; i++) {
						var el = control._environmentResultsListTwo.children[i];
						el.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + el._latin.replace(/_/g, ' ');
					}
				}

				control._whichName = 'latin';
				jQuery('.utk-name-switcher-button').animate({'left': '1302px'});

				if(control._selectedSpeciesRef !== undefined) {
					control._comparisonPaneSpecies.innerHTML = control._selectedSpeciesRef._latin.replace(/_/g, ' ');
				}
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
		searchButton.id = 'searchButton';
		settingsButton.disabled = true;
		searchButton.disabled = true;
		settingsButton.title = 'Loading...0%';
		searchButton.title = 'Loading...0%';
		settingsButton.onclick = function() {
			control._expandSearch('settingsButton');
		}
		searchButton.onclick = function() {
			control._expandSearch('searchButton');
		}
		settingsButton.innerHTML = '<img src="images/settingsButton.png"></img>';
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
			for(var i = 0; i < control._speciesSightings.length; i++) {
				NPMap.config.L.removeLayer(control._speciesSightings[i]);
			}

			control._showObservations = false;
		} else {
			for(var i = 0; i < control._speciesSightings.length; i++) {
				control._speciesSightings[i].addTo(NPMap.config.L);
			}

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
	_fuseSearch: function(value, ul, index) {
		if(control._whichName === 'latin') {
			var results = control._latinFuser.search(value);
		} else {
			var results = control._commonFuser.search(value);
		}

		if(results.length > 0) {
			ul.style.display = 'block';
			document.getElementById('searchButton').style.zIndex = -3;
			document.getElementById('settingsButton').style.zIndex = -3;
		} else {
			ul.style.display = 'none';
			document.getElementById('searchButton').style.zIndex = 1;
			document.getElementById('settingsButton').style.zIndex = 1;
		}

		ul.innerHTML = '';
		for(var i = 0; i < results.length && i < 15; i++) {
			var li = L.DomUtil.create('li', 'search-result');
			if(control._whichName === 'latin') {
				li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + results[i].latin_name.replace(/_/g, ' ');
			} else {
				li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + results[i].common_name.replace(/_/g, ' ');
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
				var first = (control._selectedSpecies[0] === undefined);
				if(control._selectedSpecies[index] !== undefined) {
					NPMap.config.L.removeLayer(control._selectedSpecies[index]);

					if(control._showObservations) {
						NPMap.config.L.removeLayer(control._speciesSightings[index]);
					}
				}

				if(index === 0) {
					control._selectedSpecies[index] = L.npmap.layer.mapbox({
						name: this._latin,
						opacity: .5,
						id: 'nps.GRSM_' + this._id + '_blue'
					}).addTo(NPMap.config.L);
				} else if(index === 1) {
					control._selectedSpecies[index] = L.npmap.layer.mapbox({
						name: this._latin,
						opacity: .5,
						id: 'nps.GRSM_' + this._id + '_pink'
					}).addTo(NPMap.config.L);
				}
				control._selectedSpecies[index]._idNumber = this._id;
				control._selectedSpecies[index]._latin = this._latin;
				control._selectedSpecies[index]._common = this._common;

				control._speciesSightings[index] = L.npmap.layer.geojson({
					name: this._latin + '_observations',
					url: 'npmap-species/atbirecords/Geojsons/all/' + this._latin + '.geojson',
					type: 'geojson',
					popup: {
						title: this._latin.replace(/_/g, ' ') + ' sighting',
						description: 'Coordinates: {{coordinates}}'
					},
					styles: {
						point: {
							'marker-color': '#2b80b6',
							'marker-size': 'small'
						}
					},
					cluster: {
						clusterIcon: '#2b80b6'
					},
					showCoverageOnHover: true,
					disableClusteringAtZoom: 15,
					polygonOptions: {
						color: '#2b80b6',
						fillColor: '#2b80b6'
					}
				});

				if(control._showObservations) {
					control._speciesSightings[index].addTo(NPMap.config.L);
				}

				ul.style.display = 'none';
				ul.innerHTML = '';
				control._initialSearchLexBox.value = '';
				if(control._lexSearchBox !== undefined) control._lexSearchBox.value = '';

				if(control._whichName === 'latin') {
					var breadcrumbSpecies = L.DomUtil.create('div', '');
					breadcrumbSpecies.style.display = 'inline-block';
					breadcrumbSpecies.style.float = 'left';
					breadcrumbSpecies.innerHTML = '> ' + this._latin.replace(/_/g, ' ').toUpperCase();
					breadcrumbSpecies._latin = this._latin;
					breadcrumbSpecies._common = this._common;
					control._breadcrumb.appendChild(breadcrumbSpecies);
					control._breadcrumbSpecies = breadcrumbSpecies;

					control._comparisonPaneSpecies.innerHTML = this._latin.replace(/_/g, ' ');
				} else {
					var breadcrumbSpecies = L.DomUtil.create('div', '');
					breadcrumbSpecies.style.display = 'inline-block';
					breadcrumbSpecies.style.float = 'left';
					breadcrumbSpecies.innerHTML = ' > ' + this._common.replace(/_/g, ' ').toUpperCase();
					breadcrumbSpecies._latin = this._latin;
					breadcrumbSpecies._common = this._common;
					control._breadcrumb.appendChild(breadcrumbSpecies);
					control._breadcrumbSpecies = breadcrumbSpecies;
				}

				control._selectedSpeciesRef = control._selectedSpecies[0];
				control._searchDiv.removeChild(control._initialSearchDiv);
				control._searchDiv.appendChild(control._comparisonPane);
				control._searchDiv.removeChild(control._nameSwitcherText);
				control._searchDiv.removeChild(control._nameSwitcherButton);
				control._searchDiv.appendChild(control._nameSwitcherText);
				control._searchDiv.appendChild(control._nameSwitcherButton);
				control._lastSearchPage = control._comparisonPane;
				if(control._firstLexicalSearch === undefined) {
					control._firstLexicalSearch = false;
				} else {
					if(control._distributionResultsListOne !== undefined ) {
						control._distributionResultsListOne.innerHTML = '';
						var found = [ control._selectedSpecies[0]._latin ];
						for(var i = 0; i < 15; i++) {
							var max = -1;
							var maxItem = '';
							var spList = control._similarDistributions[control._selectedSpecies[0]._latin];

							for(var key in spList) {
								if(spList[key] > max && found.indexOf(key) === -1) {
									maxItem = key;
									max = spList[key];
								}
							}

							found.push(maxItem);
							var li = L.DomUtil.create('li', 'search-result');
							if(control._whichName === 'latin') {
								if(maxItem.length > 30) {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + maxItem.replace(/_/g, ' ').slice(0, 29) + '...';
									li.title = maxItem.replace(/_/g, ' ');
								} else {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + maxItem.replace(/_/g, ' ');
								}
							} else {
								if(maxItem.length > 30) {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[maxItem].common.replace(/_/g, ' ').slice(0, 29) + '...';
									li.title = control._nameMappings[maxItem].common.replace(/_/g, ' ');
								} else {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[maxItem].common.replace(/_/g, ' ');
								}
							}
							li._idx = i;
							li._latin = maxItem;
							li._common = control._nameMappings[maxItem].common;
							li._id = control._nameMappings[maxItem].id;
							li.style.margin = '0px';
							li.style.listStylePosition = 'inside';
							li.style.backgroundColor = '#292928';
							li.style.border = '1px solid black';
							li.style.color = '#f5faf2';
							li.style.letterSpacing = '.025em';
							li.style.fontSize = '14pt';
							li.style.lineHeight = '31px';
							li.style.width = '370px';
							li.style.cursor = 'pointer';
							li.onclick = function() {
								if(control._hiddenSpeciesTwo !== undefined) {
									control._distributionResultsListTwo.insertBefore(control._hiddenSpeciesTwo, control._distributionResultsListTwo.children[control._hiddenSpeciesTwo._idx]);
								}
								control._hiddenSpeciesTwo = this;
								control._distributionResultsListTwo.removeChild(control._distributionResultsListTwo.children[this._idx]);

								if(control._selectedSpecies[1] !== undefined) {
									NPMap.config.L.removeLayer(control._selectedSpecies[1]);

									if(control._showObservations) {
										NPMap.config.L.removeLayer(control._speciesSightings[1]);
									}
								}

								control._selectedSpecies[1] = L.npmap.layer.mapbox({
									name: this._latin,
									opacity: .5,
									id: 'nps.GRSM_' + this._id + '_pink'
								}).addTo(NPMap.config.L);
								control._selectedSpecies[1]._idNumber = this._id;
								control._selectedSpecies[1]._latin = this._latin;
								control._selectedSpecies[1]._common = this._common;

								control._speciesSightings[1] = L.npmap.layer.geojson({
									name: this._latin + '_observations',
									url: 'npmap-species/atbirecords/Geojsons/all/' + this._latin + '.geojson',
									type: 'geojson',
									popup: {
										title: this._latin.replace(/_/g, ' ') + ' sighting',
										description: 'Coordinates: {{coordinates}}'
									},
									styles: {
										point: {
											'marker-color': '#ca1892',
											'marker-size': 'small'
										}
									},
									cluster: {
										clusterIcon: '#ca1892'
									},
									showCoverageOnHover: true,
									disableClusteringAtZoom: 15,
									polygonOptions: {
										color: '#ca1892',
										fillColor: '#ca1892'
									}
								});

								if(control._showObservations) {
									control._speciesSightings[1].addTo(NPMap.config.L);
								}

								control._distributionDropdownOne._latin = this._latin;
								control._distributionDropdownOne._common = this._common;
								control._distributionDropdownOne.innerHTML = this.innerHTML;
								control._distributionDropdownOne.style.backgroundColor = '#ca1892';
								control._distributionDropdownOne.style.letterSpacing = '.025em';
								control._distributionDropdownOne.style.fontSize = '14pt';
								control._distributionDropdownOne.style.color = '#f5faf2';
								control._distributionDropdownOne.appendChild(dOneTriangle);
								control._distributionResultsListOne.style.display = 'none';
							}

							control._distributionResultsListOne.appendChild(li);
						}
					}
					if(control._distributionResultsListTwo !== undefined ) {
						control._distributionResultsListTwo.innerHTML = '';
						var found = [ control._selectedSpecies[0]._latin ];
						for(var i = 0; i < 15; i++) {
							var max = -1;
							var maxItem = '';
							var spList = control._similarDistributions[control._selectedSpecies[0]._latin];

							for(var key in spList) {
								if(spList[key] > max && found.indexOf(key) === -1) {
									maxItem = key;
									max = spList[key];
								}
							}

							found.push(maxItem);
							var li = L.DomUtil.create('li', 'search-result');
							if(control._whichName === 'latin') {
								if(maxItem.length > 30) {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + maxItem.replace(/_/g, ' ').slice(0, 29) + '...';
									li.title = maxItem.replace(/_/g, ' ');
								} else {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + maxItem.replace(/_/g, ' ');
								}
							} else {
								if(maxItem.length > 30) {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[maxItem].common.replace(/_/g, ' ').slice(0, 29) + '...';
									li.title = control._nameMappings[maxItem].common.replace(/_/g, ' ');
								} else {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[maxItem].common.replace(/_/g, ' ');
								}
							}
							li._idx = i;
							li._latin = maxItem;
							li._common = control._nameMappings[maxItem].common;
							li._id = control._nameMappings[maxItem].id;
							li.style.margin = '0px';
							li.style.listStylePosition = 'inside';
							li.style.backgroundColor = '#292928';
							li.style.border = '1px solid black';
							li.style.color = '#f5faf2';
							li.style.letterSpacing = '.025em';
							li.style.fontSize = '14pt';
							li.style.lineHeight = '31px';
							li.style.width = '370px';
							li.style.cursor = 'pointer';
							li.onclick = function() {
								if(control._hiddenSpeciesOne !== undefined) {
									control._distributionResultsListOne.insertBefore(control._hiddenSpeciesOne, control._distributionResultsListOne.children[control._hiddenSpeciesOne._idx]);
								}
								control._hiddenSpeciesOne = this;
								control._distributionResultsListOne.removeChild(control._distributionResultsListOne.children[this._idx]);

								if(control._selectedSpecies[2] !== undefined) {
									NPMap.config.L.removeLayer(control._selectedSpecies[2]);

									if(control._showObservations) {
										NPMap.config.L.removeLayer(control._speciesSightings[2]);
									}
								}

								control._selectedSpecies[2] = L.npmap.layer.mapbox({
									name: this._latin,
									opacity: .5,
									id: 'nps.GRSM_' + this._id + '_orange'
								}).addTo(NPMap.config.L);
								control._selectedSpecies[2]._idNumber = this._id;
								control._selectedSpecies[2]._latin = this._latin;
								control._selectedSpecies[2]._common = this._common;

								control._speciesSightings[2] = L.npmap.layer.geojson({
									name: this._latin + '_observations',
									url: 'npmap-species/atbirecords/Geojsons/all/' + this._latin + '.geojson',
									type: 'geojson',
									popup: {
										title: this._latin.replace(/_/g, ' ') + ' sighting',
										description: 'Coordinates: {{coordinates}}'
									},
									styles: {
										point: {
											'marker-color': '#f28e43',
											'marker-size': 'small'
										}
									},
									cluster: {
										clusterIcon: '#f28e43'
									},
									showCoverageOnHover: true,
									disableClusteringAtZoom: 15,
									polygonOptions: {
										color: '#f28e43',
										fillColor: '#f28e43'
									}
								});

								if(control._showObservations) {
									control._speciesSightings[2].addTo(NPMap.config.L);
								}

								control._distributionDropdownTwo._latin = this._latin;
								control._distributionDropdownTwo._common = this._common;
								control._distributionDropdownTwo.innerHTML = this.innerHTML;
								control._distributionDropdownTwo.style.backgroundColor = '#f28e43';
								control._distributionDropdownTwo.style.letterSpacing = '.025em';
								control._distributionDropdownTwo.style.fontSize = '14pt';
								control._distributionDropdownTwo.style.color = '#f5faf2';
								control._distributionDropdownTwo.appendChild(dTwoTriangle);
								control._distributionResultsListTwo.style.display = 'none';
							}
							control._distributionResultsListTwo.appendChild(li);
						}
					}
					if(control._environmentResultsListOne !== undefined ) {
						control._environmentResultsListOne.innerHTML = '';
						var found = [ control._selectedSpecies[0]._latin ];
						for(var i = 0; i < 15; i++) {
							var min = 10000000000;
							var minItem = '';
							var spList = control._similarEnvironments[control._selectedSpecies[0]._latin];

							for(var key in spList) {
								if(spList[key] < min && found.indexOf(key) === -1) {
									minItem = key;
									min = spList[key];
								}
							}

							found.push(minItem);
							var li = L.DomUtil.create('li', 'search-result');
							if(control._whichName === 'latin') {
								if(minItem.length > 30) {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + minItem.replace(/_/g, ' ').slice(0, 29) + '...';
									li.title = minItem.replace(/_/g, ' ');
								} else {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + minItem.replace(/_/g, ' ');
								}
							} else {
								if(minItem.length > 30) {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[minItem].common.replace(/_/g, ' ').slice(0, 29) + '...';
									li.title = control._nameMappings[minItem].common.replace(/_/g, ' ');
								} else {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[minItem].common.replace(/_/g, ' ');
								}
							}
							li._idx = i;
							li._latin = minItem;
							li._common = control._nameMappings[minItem].common;
							li._id = control._nameMappings[minItem].id;
							li.style.margin = '0px';
							li.style.listStylePosition = 'inside';
							li.style.backgroundColor = '#292928';
							li.style.border = '1px solid black';
							li.style.color = '#f5faf2';
							li.style.letterSpacing = '.025em';
							li.style.fontSize = '14pt';
							li.style.lineHeight = '31px';
							li.style.width = '370px';
							li.style.cursor = 'pointer';
							li.onclick = function() {
								if(control._hiddenSpeciesTwo !== undefined) {
									control._environmentResultsListTwo.insertBefore(control._hiddenSpeciesTwo, control._environmentResultsListTwo.children[control._hiddenSpeciesTwo._idx]);
								}
								control._hiddenSpeciesTwo = this;
								control._environmentResultsListTwo.removeChild(control._environmentResultsListTwo.children[this._idx]);

								if(control._selectedSpecies[1] !== undefined) {
									NPMap.config.L.removeLayer(control._selectedSpecies[1]);

									if(control._showObservations) {
										NPMap.config.L.removeLayer(control._speciesSightings[1]);
									}
								}

								control._selectedSpecies[1] = L.npmap.layer.mapbox({
									name: this._latin,
									opacity: .5,
									id: 'nps.GRSM_' + this._id + '_pink'
								}).addTo(NPMap.config.L);
								control._selectedSpecies[1]._idNumber = this._id;
								control._selectedSpecies[1]._latin = this._latin;
								control._selectedSpecies[1]._common = this._common;

								control._speciesSightings[1] = L.npmap.layer.geojson({
									name: this._latin + '_observations',
									url: 'npmap-species/atbirecords/Geojsons/all/' + this._latin + '.geojson',
									type: 'geojson',
									popup: {
										title: this._latin.replace(/_/g, ' ') + ' sighting',
										description: 'Coordinates: {{coordinates}}'
									},
									styles: {
										point: {
											'marker-color': '#ca1892',
											'marker-size': 'small'
										}
									},
									cluster: {
										clusterIcon: '#ca1892'
									},
									showCoverageOnHover: true,
									disableClusteringAtZoom: 15,
									polygonOptions: {
										color: '#ca1892',
										fillColor: '#ca1892'
									}
								});

								if(control._showObservations) {
									control._speciesSightings[1].addTo(NPMap.config.L);
								}

								control._environmentDropdownOne._latin = this._latin;
								control._environmentDropdownOne._common = this._common;
								control._environmentDropdownOne.innerHTML = this.innerHTML;
								control._environmentDropdownOne.style.backgroundColor = '#ca1892';
								control._environmentDropdownOne.style.letterSpacing = '.025em';
								control._environmentDropdownOne.style.fontSize = '14pt';
								control._environmentDropdownOne.style.color = '#f5faf2';
								control._environmentDropdownOne.appendChild(eOneTriangle);
								control._environmentResultsListOne.style.display = 'none';
							}
							control._environmentResultsListOne.appendChild(li);
						}
					}
					if(control._environmentResultsListTwo !== undefined ) {
						control._environmentResultsListTwo.innerHTML = '';
						var found = [ control._selectedSpecies[0]._latin ];
						for(var i = 0; i < 15; i++) {
							var min = 10000000000;
							var minItem = '';
							var spList = control._similarEnvironments[control._selectedSpecies[0]._latin];

							for(var key in spList) {
								if(spList[key] < min && found.indexOf(key) === -1) {
									minItem = key;
									min = spList[key];
								}
							}

							found.push(minItem);
							var li = L.DomUtil.create('li', 'search-result');
							if(control._whichName === 'latin') {
								if(minItem.length > 30) {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + minItem.replace(/_/g, ' ').slice(0, 29) + '...';
									li.title = minItem.replace(/_/g, ' ');
								} else {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + minItem.replace(/_/g, ' ');
								}
							} else {
								if(minItem.length > 30) {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[minItem].common.replace(/_/g, ' ').slice(0, 29) + '...';
									li.title = control._nameMappings[minItem].common.replace(/_/g, ' ');
								} else {
									li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[minItem].common.replace(/_/g, ' ');
								}
							}
							li._idx = i;
							li._latin = minItem;
							li._common = control._nameMappings[minItem].common;
							li._id = control._nameMappings[minItem].id;
							li.style.margin = '0px';
							li.style.listStylePosition = 'inside';
							li.style.backgroundColor = '#292928';
							li.style.border = '1px solid black';
							li.style.color = '#f5faf2';
							li.style.letterSpacing = '.025em';
							li.style.fontSize = '14pt';
							li.style.lineHeight = '31px';
							li.style.width = '370px';
							li.style.cursor = 'pointer';
							li.onclick = function() {
								if(control._hiddenSpeciesTwo !== undefined) {
									control._environmentResultsListTwo.insertBefore(control._hiddenSpeciesTwo, control._environmentResultsListTwo.children[control._hiddenSpeciesTwo._idx]);
								}
								control._hiddenSpeciesTwo = this;
								control._environmentResultsListTwo.removeChild(control._environmentResultsListTwo.children[this._idx]);

								if(control._selectedSpecies[1] !== undefined) {
									NPMap.config.L.removeLayer(control._selectedSpecies[1]);

									if(control._showObservations) {
										NPMap.config.L.removeLayer(control._speciesSightings[1]);
									}
								}

								control._selectedSpecies[1] = L.npmap.layer.mapbox({
									name: this._latin,
									opacity: .5,
									id: 'nps.GRSM_' + this._id + '_pink'
								}).addTo(NPMap.config.L);
								control._selectedSpecies[1]._idNumber = this._id;
								control._selectedSpecies[1]._latin = this._latin;
								control._selectedSpecies[1]._common = this._common;

								control._speciesSightings[1] = L.npmap.layer.geojson({
									name: this._latin + '_observations',
									url: 'npmap-species/atbirecords/Geojsons/all/' + this._latin + '.geojson',
									type: 'geojson',
									popup: {
										title: this._latin.replace(/_/g, ' ') + ' sighting',
										description: 'Coordinates: {{coordinates}}'
									},
									styles: {
										point: {
											'marker-color': '#ca1892',
											'marker-size': 'small'
										}
									},
									cluster: {
										clusterIcon: '#ca1892'
									},
									showCoverageOnHover: true,
									disableClusteringAtZoom: 15,
									polygonOptions: {
										color: '#ca1892',
										fillColor: '#ca1892'
									}
								});

								if(control._showObservations) {
									control._speciesSightings[1].addTo(NPMap.config.L);
								}

								control._environmentDropdownOne._latin = this._latin;
								control._environmentDropdownOne._common = this._common;
								control._environmentDropdownOne.innerHTML = this.innerHTML;
								control._environmentDropdownOne.style.backgroundColor = '#ca1892';
								control._environmentDropdownOne.style.letterSpacing = '.025em';
								control._environmentDropdownOne.style.fontSize = '14pt';
								control._environmentDropdownOne.style.color = '#f5faf2';
								control._environmentDropdownOne.appendChild(eOneTriangle);
								control._environmentResultsListOne.style.display = 'none';
							}
							control._environmentResultsListOne.appendChild(li);
						}
					}
				}
			}

			ul.appendChild(li);
		}
	},
	_changeCompare: function(whichCompare) {
		control._whichCompare = whichCompare;

		if(control._selectedSpecies[1] !== undefined) {
			NPMap.config.L.removeLayer(control._selectedSpecies[1]);
			if(control._showObservations) {
				NPMap.config.L.removeLayer(control._speciesSightings[1]);
			}
		}
		if(control._selectedSpecies[2] !== undefined) {
			NPMap.config.L.removeLayer(control._selectedSpecies[2]);
			if(control._showObservations) {
				NPMap.config.L.removeLayer(control._speciesSightings[2]);
			}
		}

		if(whichCompare === 'distribution') {
			jQuery('.compare-distribution').animate({
				width: '740px'
			});
			control._distributionPaneLabelTop.innerHTML = 'COMPARE WITH ...';
			control._distributionPaneLabelMain.innerHTML = 'SPECIES WITH SIMILAR DISTRIBUTION';
			control._distributionPaneLabelMain.style.color = '#f5faf2';
			control._distributionPaneLabelMain.style.fontSize = '16pt';
			control._distributionPaneLabelMain.style.lineHeight = '25px';

			/* distribution pane content */
			control._hiddenSpeciesTwo = undefined;
			var distributionDropdownOne = L.DomUtil.create('div', 'dropdown');
			distributionDropdownOne._latin = '';
			distributionDropdownOne._common = '';
			distributionDropdownOne.innerHTML = 'SELECT SPECIES 2';
			distributionDropdownOne.style.position = 'absolute';
			distributionDropdownOne.style.lineHeight = '33px';
			distributionDropdownOne.style.fontSize = '10pt';
			distributionDropdownOne.style.letterSpacing = '.001em';
			distributionDropdownOne.style.top = '0px';
			distributionDropdownOne.style.left = '300px';
			dOneTriangle = L.DomUtil.create('div', 'triangle');
			dOneTriangle.style.position = 'absolute';
			dOneTriangle.style.top = '15px';
			dOneTriangle.style.left = '360px';
			dOneTriangle.style.float = 'left';
			distributionDropdownOne.appendChild(dOneTriangle);
			control._dOneTriangle = dOneTriangle;
			var distributionResultsListOne = L.DomUtil.create('ul', 'dist-results');
			distributionResultsListOne.style.position = 'absolute';
			distributionResultsListOne.style.top = '33px';
			distributionResultsListOne.style.left = '300px';
			distributionResultsListOne.style.display = 'none';
			distributionResultsListOne.style.margin = '0px';
			distributionResultsListOne.style.zIndex = 100;
			var found = [ control._selectedSpecies[0]._latin ];
			for(var i = 0; i < 15; i++) {
				var max = -1;
				var maxItem = '';
				var spList = control._similarDistributions[control._selectedSpecies[0]._latin];

				for(var key in spList) {
					if(spList[key] > max && found.indexOf(key) === -1) {
						maxItem = key;
						max = spList[key];
					}
				}

				found.push(maxItem);
				var li = L.DomUtil.create('li', 'search-result');
				if(control._whichName === 'latin') {
					if(maxItem.length > 30) {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + maxItem.replace(/_/g, ' ').slice(0, 29) + '...';
						li.title = maxItem.replace(/_/g, ' ');
					} else {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + maxItem.replace(/_/g, ' ');
					}
				} else {
					if(maxItem.length > 30) {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[maxItem].common.replace(/_/g, ' ').slice(0, 29) + '...';
						li.title = control._nameMappings[maxItem].common.replace(/_/g, ' ');
					} else {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[maxItem].common.replace(/_/g, ' ');
					}
				}
				li._idx = i;
				li._latin = maxItem;
				li._common = control._nameMappings[maxItem].common;
				li._id = control._nameMappings[maxItem].id;
				li.style.margin = '0px';
				li.style.listStylePosition = 'inside';
				li.style.backgroundColor = '#292928';
				li.style.border = '1px solid black';
				li.style.color = '#f5faf2';
				li.style.letterSpacing = '.025em';
				li.style.fontSize = '14pt';
				li.style.lineHeight = '31px';
				li.style.width = '370px';
				li.style.cursor = 'pointer';
				li.onclick = function() {
					if(control._hiddenSpeciesTwo !== undefined) {
						control._distributionResultsListTwo.insertBefore(control._hiddenSpeciesTwo, control._distributionResultsListTwo.children[control._hiddenSpeciesTwo._idx]);
					}
					control._hiddenSpeciesTwo = this;
					control._distributionResultsListTwo.removeChild(control._distributionResultsListTwo.children[this._idx]);

					if(control._selectedSpecies[1] !== undefined) {
						NPMap.config.L.removeLayer(control._selectedSpecies[1]);

						if(control._showObservations) {
							NPMap.config.L.removeLayer(control._speciesSightings[1]);
						}
					}

					control._selectedSpecies[1] = L.npmap.layer.mapbox({
						name: this._latin,
						opacity: .5,
						id: 'nps.GRSM_' + this._id + '_pink'
					}).addTo(NPMap.config.L);
					control._selectedSpecies[1]._idNumber = this._id;
					control._selectedSpecies[1]._latin = this._latin;
					control._selectedSpecies[1]._common = this._common;

					control._speciesSightings[1] = L.npmap.layer.geojson({
						name: this._latin + '_observations',
						url: 'npmap-species/atbirecords/Geojsons/all/' + this._latin + '.geojson',
						type: 'geojson',
						popup: {
							title: this._latin.replace(/_/g, ' ') + ' sighting',
							description: 'Coordinates: {{coordinates}}'
						},
						styles: {
							point: {
								'marker-color': '#ca1892',
								'marker-size': 'small'
							}
						},
						cluster: {
							clusterIcon: '#ca1892'
						},
						showCoverageOnHover: true,
						disableClusteringAtZoom: 15,
						polygonOptions: {
							color: '#ca1892',
							fillColor: '#ca1892'
						}
					});

					if(control._showObservations) {
						control._speciesSightings[1].addTo(NPMap.config.L);
					}

					distributionDropdownOne._latin = this._latin;
					distributionDropdownOne._common = this._common;
					distributionDropdownOne.innerHTML = this.innerHTML;
					distributionDropdownOne.style.backgroundColor = '#ca1892';
					distributionDropdownOne.style.letterSpacing = '.025em';
					distributionDropdownOne.style.fontSize = '14pt';
					distributionDropdownOne.style.color = '#f5faf2';
					distributionDropdownOne.appendChild(dOneTriangle);
					control._distributionResultsListOne.style.display = 'none';
				}

				distributionResultsListOne.appendChild(li);
			}
			control._distroOneSelected = false;
			distributionDropdownOne.onclick = function() {
				if(control._distroOneSelected) {
					control._distroOneSelected = false;
					distributionResultsListOne.style.display = 'none';
				} else {
					control._distroOneSelected = true;
					distributionResultsListOne.style.display = 'block';
				}
			}
			control._hiddenSpeciesOne = undefined;
			var distributionDropdownTwo = L.DomUtil.create('div', 'dropdown');
			distributionDropdownTwo._latin = '';
			distributionDropdownTwo._common = '';
			distributionDropdownTwo.innerHTML = 'SELECT SPECIES 3';
			distributionDropdownTwo.style.position = 'absolute';
			distributionDropdownTwo.style.lineHeight = '33px';
			distributionDropdownTwo.style.fontSize = '10pt';
			distributionDropdownTwo.style.letterSpacing = '.001em';
			distributionDropdownTwo.style.top = '51px';
			distributionDropdownTwo.style.left = '300px';
			dTwoTriangle = L.DomUtil.create('div', 'triangle');
			dTwoTriangle.style.position = 'absolute';
			dTwoTriangle.style.top = '15px';
			dTwoTriangle.style.left = '360px';
			dTwoTriangle.style.float = 'left';
			distributionDropdownTwo.appendChild(dTwoTriangle);
			control._dTwoTriangle = dTwoTriangle;
			var distributionResultsListTwo = L.DomUtil.create('ul', 'dist-results');
			distributionResultsListTwo.style.position = 'absolute';
			distributionResultsListTwo.style.top = '84px';
			distributionResultsListTwo.style.left = '300px';
			distributionResultsListTwo.style.display = 'none';
			distributionResultsListTwo.style.margin = '0px';
			distributionResultsListTwo.style.zIndex = 99;
			var found = [ control._selectedSpecies[0]._latin ];
			for(var i = 0; i < 15; i++) {
				var max = -1;
				var maxItem = '';
				var spList = control._similarDistributions[control._selectedSpecies[0]._latin];

				for(var key in spList) {
					if(spList[key] > max && found.indexOf(key) === -1) {
						maxItem = key;
						max = spList[key];
					}
				}

				found.push(maxItem);
				var li = L.DomUtil.create('li', 'search-result');
				if(control._whichName === 'latin') {
					if(maxItem.length > 30) {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + maxItem.replace(/_/g, ' ').slice(0, 29) + '...';
						li.title = maxItem.replace(/_/g, ' ');
					} else {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + maxItem.replace(/_/g, ' ');
					}
				} else {
					if(maxItem.length > 30) {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[maxItem].common.replace(/_/g, ' ').slice(0, 29) + '...';
						li.title = control._nameMappings[maxItem].common.replace(/_/g, ' ');
					} else {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[maxItem].common.replace(/_/g, ' ');
					}
				}
				li._idx = i;
				li._latin = maxItem;
				li._common = control._nameMappings[maxItem].common;
				li._id = control._nameMappings[maxItem].id;
				li.style.margin = '0px';
				li.style.listStylePosition = 'inside';
				li.style.backgroundColor = '#292928';
				li.style.border = '1px solid black';
				li.style.color = '#f5faf2';
				li.style.letterSpacing = '.025em';
				li.style.fontSize = '14pt';
				li.style.lineHeight = '31px';
				li.style.width = '370px';
				li.style.cursor = 'pointer';
				li.onclick = function() {
					if(control._hiddenSpeciesOne !== undefined) {
						control._distributionResultsListOne.insertBefore(control._hiddenSpeciesOne, control._distributionResultsListOne.children[control._hiddenSpeciesOne._idx]);
					}
					control._hiddenSpeciesOne = this;
					control._distributionResultsListOne.removeChild(control._distributionResultsListOne.children[this._idx]);

					if(control._selectedSpecies[2] !== undefined) {
						NPMap.config.L.removeLayer(control._selectedSpecies[2]);

						if(control._showObservations) {
							NPMap.config.L.removeLayer(control._speciesSightings[2]);
						}
					}

					control._selectedSpecies[2] = L.npmap.layer.mapbox({
						name: this._latin,
						opacity: .5,
						id: 'nps.GRSM_' + this._id + '_orange'
					}).addTo(NPMap.config.L);
					control._selectedSpecies[2]._idNumber = this._id;
					control._selectedSpecies[2]._latin = this._latin;
					control._selectedSpecies[2]._common = this._common;

					control._speciesSightings[2] = L.npmap.layer.geojson({
						name: this._latin + '_observations',
						url: 'npmap-species/atbirecords/Geojsons/all/' + this._latin + '.geojson',
						type: 'geojson',
						popup: {
							title: this._latin.replace(/_/g, ' ') + ' sighting',
							description: 'Coordinates: {{coordinates}}'
						},
						styles: {
							point: {
								'marker-color': '#f28e43',
								'marker-size': 'small'
							}
						},
						cluster: {
							clusterIcon: '#f28e43'
						},
						showCoverageOnHover: true,
						disableClusteringAtZoom: 15,
						polygonOptions: {
							color: '#f28e43',
							fillColor: '#f28e43'
						}
					});

					if(control._showObservations) {
						control._speciesSightings[2].addTo(NPMap.config.L);
					}

					distributionDropdownTwo._latin = this._latin;
					distributionDropdownTwo._common = this._common;
					distributionDropdownTwo.innerHTML = this.innerHTML;
					distributionDropdownTwo.style.backgroundColor = '#f28e43';
					distributionDropdownTwo.style.letterSpacing = '.025em';
					distributionDropdownTwo.style.fontSize = '14pt';
					distributionDropdownTwo.style.color = '#f5faf2';
					distributionDropdownTwo.appendChild(dTwoTriangle);
					control._distributionResultsListTwo.style.display = 'none';
				}
				distributionResultsListTwo.appendChild(li);
			}
			control._distroTwoSelected = false;
			distributionDropdownTwo.onclick = function() {
				if(control._distroTwoSelected) {
					control._distroTwoSelected = false;
					distributionResultsListTwo.style.display = 'none';
				} else {
					control._distroTwoSelected = true;
					distributionResultsListTwo.style.display = 'block';
				}
			}
			control._comparisonDistributionPane.appendChild(distributionDropdownOne);
			control._comparisonDistributionPane.appendChild(distributionResultsListOne);
			control._comparisonDistributionPane.appendChild(distributionDropdownTwo);
			control._comparisonDistributionPane.appendChild(distributionResultsListTwo);
			control._distributionDropdownOne = distributionDropdownOne;
			control._distributionResultsListOne = distributionResultsListOne;
			control._distributionDropdownTwo = distributionDropdownTwo;
			control._distributionResultsListTwo = distributionResultsListTwo;

			/* close other panes */
			jQuery('.compare-environment').animate({
				left: '977px',
				width: '125px',
			});
			control._environmentPaneLabelTop.innerHTML = '';
			control._environmentPaneLabelMain.innerHTML = 'COMPARE ENVIRONMENT';
			control._environmentPaneLabelMain.style.color = '#909090';
			control._environmentPaneLabelMain.style.fontSize = '10pt';
			control._environmentPaneLabelMain.style.lineHeight = '18px';
			if(control._environmentDropdownOne !== undefined) {
				control._environmentDropdownOne.remove();
				control._environmentDropdownOne = undefined;
				control._environmentResultsListOne.remove();
				control._environmentDropdownOne = undefined;
				control._environmentDropdownTwo.remove();
				control._environmentDropdownOne = undefined;
				control._environmentResultsListTwo.remove();
				control._environmentDropdownOne = undefined;
			}
			jQuery('.compare-lexical').animate({
				left: '1121px',
				width: '105px',
			});
			if(control._compareLexBox !== undefined) {
				control._compareLexBox.remove();
				control._compareLexBox = undefined;
				control._lexResultsList.remove();
				control._lexResultsList = undefined;
			}
			control._lexicalPaneLabelTop.innerHTML = '';
			control._lexicalPaneLabelMain.innerHTML = 'COMPARE<br>SPECIES';
			control._lexicalPaneLabelMain.style.color = '#909090';
			control._lexicalPaneLabelMain.style.fontSize = '10pt';
			control._lexicalPaneLabelMain.style.lineHeight = '18px';
		} else if(whichCompare === 'environment') {
			jQuery('.compare-distribution').animate({
				width: '125px'
			});
			control._distributionPaneLabelTop.innerHTML = '';
			control._distributionPaneLabelMain.innerHTML = 'COMPARE DISTRIBUTION';
			control._distributionPaneLabelMain.style.color = '#909090';
			control._distributionPaneLabelMain.style.fontSize = '10pt';
			control._distributionPaneLabelMain.style.lineHeight = '18px';
			if(control._distributionDropdownOne !== undefined) {
				control._distributionDropdownOne.remove();
				control._distributionDropdownOne = undefined;
				control._distributionResultsListOne.remove();
				control._distributionDropdownOne = undefined;
				control._distributionDropdownTwo.remove();
				control._distributionDropdownOne = undefined;
				control._distributionResultsListTwo.remove();
				control._distributionDropdownOne = undefined;
			}

			jQuery('.compare-environment').animate({
				left: '370px',
				width: '740px',
			});
			control._environmentPaneLabelTop.innerHTML = 'COMPARE WITH ...';
			control._environmentPaneLabelMain.innerHTML = 'SPECIES WITH SIMILAR ENVIRONMENT';
			control._environmentPaneLabelMain.style.color = '#f5faf2';
			control._environmentPaneLabelMain.style.fontSize = '16pt';
			control._environmentPaneLabelMain.style.lineHeight = '25px';

			/* environment pane content */
			control._hiddenSpeciesTwo = undefined;
			var environmentDropdownOne = L.DomUtil.create('div', 'dropdown');
			environmentDropdownOne._latin = '';
			environmentDropdownOne._common = '';
			environmentDropdownOne.innerHTML = 'SELECT SPECIES 2';
			environmentDropdownOne.style.position = 'absolute';
			environmentDropdownOne.style.lineHeight = '33px';
			environmentDropdownOne.style.fontSize = '10pt';
			environmentDropdownOne.style.letterSpacing = '.001em';
			environmentDropdownOne.style.top = '0px';
			environmentDropdownOne.style.left = '300px';
			eOneTriangle = L.DomUtil.create('div', 'triangle');
			eOneTriangle.style.position = 'absolute';
			eOneTriangle.style.top = '15px';
			eOneTriangle.style.left = '360px';
			eOneTriangle.style.float = 'left';
			environmentDropdownOne.appendChild(eOneTriangle);
			control._eOneTriangle = eOneTriangle;
			var environmentResultsListOne = L.DomUtil.create('ul', 'dist-results');
			environmentResultsListOne.style.position = 'absolute';
			environmentResultsListOne.style.top = '33px';
			environmentResultsListOne.style.left = '300px';
			environmentResultsListOne.style.display = 'none';
			environmentResultsListOne.style.margin = '0px';
			environmentResultsListOne.style.zIndex = 100;
			var found = [ control._selectedSpecies[0]._latin ];
			for(var i = 0; i < 15; i++) {
				var min = 10000000000;
				var minItem = '';
				var spList = control._similarEnvironments[control._selectedSpecies[0]._latin];

				for(var key in spList) {
					if(spList[key] < min && found.indexOf(key) === -1) {
						minItem = key;
						min = spList[key];
					}
				}

				found.push(minItem);
				var li = L.DomUtil.create('li', 'search-result');
				if(control._whichName === 'latin') {
					if(minItem.length > 30) {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + minItem.replace(/_/g, ' ').slice(0, 29) + '...';
						li.title = minItem.replace(/_/g, ' ');
					} else {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + minItem.replace(/_/g, ' ');
					}
				} else {
					if(minItem.length > 30) {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[minItem].common.replace(/_/g, ' ').slice(0, 29) + '...';
						li.title = control._nameMappings[minItem].common.replace(/_/g, ' ');
					} else {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[minItem].common.replace(/_/g, ' ');
					}
				}
				li._idx = i;
				li._latin = minItem;
				li._common = control._nameMappings[minItem].common;
				li._id = control._nameMappings[minItem].id;
				li.style.margin = '0px';
				li.style.listStylePosition = 'inside';
				li.style.backgroundColor = '#292928';
				li.style.border = '1px solid black';
				li.style.color = '#f5faf2';
				li.style.letterSpacing = '.025em';
				li.style.fontSize = '14pt';
				li.style.lineHeight = '31px';
				li.style.width = '370px';
				li.style.cursor = 'pointer';
				li.onclick = function() {
					if(control._hiddenSpeciesTwo !== undefined) {
						control._environmentResultsListTwo.insertBefore(control._hiddenSpeciesTwo, control._environmentResultsListTwo.children[control._hiddenSpeciesTwo._idx]);
					}
					control._hiddenSpeciesTwo = this;
					control._environmentResultsListTwo.removeChild(control._environmentResultsListTwo.children[this._idx]);

					if(control._selectedSpecies[1] !== undefined) {
						NPMap.config.L.removeLayer(control._selectedSpecies[1]);

						if(control._showObservations) {
							NPMap.config.L.removeLayer(control._speciesSightings[1]);
						}
					}

					control._selectedSpecies[1] = L.npmap.layer.mapbox({
						name: this._latin,
						opacity: .5,
						id: 'nps.GRSM_' + this._id + '_pink'
					}).addTo(NPMap.config.L);
					control._selectedSpecies[1]._idNumber = this._id;
					control._selectedSpecies[1]._latin = this._latin;
					control._selectedSpecies[1]._common = this._common;

					control._speciesSightings[1] = L.npmap.layer.geojson({
						name: this._latin + '_observations',
						url: 'npmap-species/atbirecords/Geojsons/all/' + this._latin + '.geojson',
						type: 'geojson',
						popup: {
							title: this._latin.replace(/_/g, ' ') + ' sighting',
							description: 'Coordinates: {{coordinates}}'
						},
						styles: {
							point: {
								'marker-color': '#ca1892',
								'marker-size': 'small'
							}
						},
						cluster: {
							clusterIcon: '#ca1892'
						},
						showCoverageOnHover: true,
						disableClusteringAtZoom: 15,
						polygonOptions: {
							color: '#ca1892',
							fillColor: '#ca1892'
						}
					});

					if(control._showObservations) {
						control._speciesSightings[1].addTo(NPMap.config.L);
					}

					environmentDropdownOne._latin = this._latin;
					environmentDropdownOne._common = this._common;
					environmentDropdownOne.innerHTML = this.innerHTML;
					environmentDropdownOne.style.backgroundColor = '#ca1892';
					environmentDropdownOne.style.letterSpacing = '.025em';
					environmentDropdownOne.style.fontSize = '14pt';
					environmentDropdownOne.style.color = '#f5faf2';
					environmentDropdownOne.appendChild(eOneTriangle);
					control._environmentResultsListOne.style.display = 'none';
				}
				environmentResultsListOne.appendChild(li);
			}
			control._enviroOneSelected = false;
			environmentDropdownOne.onclick = function() {
				if(control._enviroOneSelected) {
					control._enviroOneSelected = false;
					environmentResultsListOne.style.display = 'none';
				} else {
					control._enviroOneSelected = true;
					environmentResultsListOne.style.display = 'block';
				}
			}
			control._hiddenSpeciesOne = undefined;
			var environmentDropdownTwo = L.DomUtil.create('div', 'dropdown');
			environmentDropdownTwo._latin = '';
			environmentDropdownTwo._common = '';
			environmentDropdownTwo.innerHTML = 'SELECT SPECIES 3';
			environmentDropdownTwo.style.position = 'absolute';
			environmentDropdownTwo.style.lineHeight = '33px';
			environmentDropdownTwo.style.fontSize = '10pt';
			environmentDropdownTwo.style.letterSpacing = '.001em';
			environmentDropdownTwo.style.top = '51px';
			environmentDropdownTwo.style.left = '300px';
			eTwoTriangle = L.DomUtil.create('div', 'triangle');
			eTwoTriangle.style.position = 'absolute';
			eTwoTriangle.style.top = '15px';
			eTwoTriangle.style.left = '360px';
			eTwoTriangle.style.float = 'left';
			environmentDropdownTwo.appendChild(eTwoTriangle);
			control._eTwoTriangle = eTwoTriangle;
			var environmentResultsListTwo = L.DomUtil.create('ul', 'dist-results');
			environmentResultsListTwo.style.position = 'absolute';
			environmentResultsListTwo.style.top = '84px';
			environmentResultsListTwo.style.left = '300px';
			environmentResultsListTwo.style.display = 'none';
			environmentResultsListTwo.style.margin = '0px';
			environmentResultsListTwo.style.zIndex = 99;
			var found = [ control._selectedSpecies[0]._latin ];
			for(var i = 0; i < 15; i++) {
				var min = 1000000000;
				var minItem = '';
				var spList = control._similarEnvironments[control._selectedSpecies[0]._latin];

				for(var key in spList) {
					if(spList[key] < min && found.indexOf(key) === -1) {
						minItem = key;
						min = spList[key];
					}
				}

				found.push(minItem);
				var li = L.DomUtil.create('li', 'search-result');
				if(control._whichName === 'latin') {
					if(minItem.length > 30) {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + minItem.replace(/_/g, ' ').slice(0, 29) + '...';
						li.title = minItem.replace(/_/g, ' ');
					} else {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + minItem.replace(/_/g, ' ');
					}
				} else {
					if(minItem.length > 30) {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[minItem].common.replace(/_/g, ' ').slice(0, 29) + '...';
						li.title = control._nameMappings[minItem].common.replace(/_/g, ' ');
					} else {
						li.innerHTML = '<img width="43" height="21" src="images/abies_fraseri.jpg"></img> ' + control._nameMappings[minItem].common.replace(/_/g, ' ');
					}
				}
				li._idx = i;
				li._latin = minItem;
				li._common = control._nameMappings[minItem].common;
				li._id = control._nameMappings[minItem].id;
				li.style.margin = '0px';
				li.style.listStylePosition = 'inside';
				li.style.backgroundColor = '#292928';
				li.style.border = '1px solid black';
				li.style.color = '#f5faf2';
				li.style.letterSpacing = '.025em';
				li.style.fontSize = '14pt';
				li.style.lineHeight = '31px';
				li.style.width = '370px';
				li.style.cursor = 'pointer';
				li.onclick = function() {
					if(control._hiddenSpeciesOne !== undefined) {
						control._environmentResultsListOne.insertBefore(control._hiddenSpeciesOne, control._environmentResultsListOne.children[control._hiddenSpeciesOne._idx]);
					}
					control._hiddenSpeciesOne = this;
					control._environmentResultsListOne.removeChild(control._environmentResultsListOne.children[this._idx]);

					if(control._selectedSpecies[2] !== undefined) {
						NPMap.config.L.removeLayer(control._selectedSpecies[2]);

						if(control._showObservations) {
							NPMap.config.L.removeLayer(control._speciesSightings[2]);
						}
					}

					control._selectedSpecies[2] = L.npmap.layer.mapbox({
						name: this._latin,
						opacity: .5,
						id: 'nps.GRSM_' + this._id + '_orange'
					}).addTo(NPMap.config.L);
					control._selectedSpecies[2]._idNumber = this._id;
					control._selectedSpecies[2]._latin = this._latin;
					control._selectedSpecies[2]._common = this._common;

					control._speciesSightings[2] = L.npmap.layer.geojson({
						name: this._latin + '_observations',
						url: 'npmap-species/atbirecords/Geojsons/all/' + this._latin + '.geojson',
						type: 'geojson',
						popup: {
							title: this._latin.replace(/_/g, ' ') + ' sighting',
							description: 'Coordinates: {{coordinates}}'
						},
						styles: {
							point: {
								'marker-color': '#f28e43',
								'marker-size': 'small'
							}
						},
						cluster: {
							clusterIcon: '#f28e43'
						},
						showCoverageOnHover: true,
						disableClusteringAtZoom: 15,
						polygonOptions: {
							color: '#f28e43',
							fillColor: '#f28e43'
						}
					});

					if(control._showObservations) {
						control._speciesSightings[2].addTo(NPMap.config.L);
					}

					environmentDropdownTwo._latin = this._latin;
					environmentDropdownTwo._common = this._common;
					environmentDropdownTwo.innerHTML = this.innerHTML;
					environmentDropdownTwo.style.backgroundColor = '#f28e43';
					environmentDropdownTwo.style.letterSpacing = '.025em';
					environmentDropdownTwo.style.fontSize = '14pt';
					environmentDropdownTwo.style.color = '#f5faf2';
					environmentDropdownTwo.appendChild(eTwoTriangle);
					control._environmentResultsListTwo.style.display = 'none';
				}
				environmentResultsListTwo.appendChild(li);
			}
			control._enviroTwoSelected = false;
			environmentDropdownTwo.onclick = function() {
				if(control._enviroTwoSelected) {
					control._enviroTwoSelected = false;
					environmentResultsListTwo.style.display = 'none';
				} else {
					control._enviroTwoSelected = true;
					environmentResultsListTwo.style.display = 'block';
				}
			}
			control._comparisonEnvironmentPane.appendChild(environmentDropdownOne);
			control._comparisonEnvironmentPane.appendChild(environmentResultsListOne);
			control._comparisonEnvironmentPane.appendChild(environmentDropdownTwo);
			control._comparisonEnvironmentPane.appendChild(environmentResultsListTwo);
			control._environmentDropdownOne = environmentDropdownOne;
			control._environmentResultsListOne = environmentResultsListOne;
			control._environmentDropdownTwo = environmentDropdownTwo;
			control._environmentResultsListTwo = environmentResultsListTwo;

			jQuery('.compare-lexical').animate({
				left: '1121px',
				width: '105px',
			});
			if(control._compareLexBox !== undefined) {
				control._compareLexBox.remove();
				control._compareLexBox = undefined;
				control._lexResultsList.remove();
				control._lexResultsList = undefined;
			}
			control._lexicalPaneLabelTop.innerHTML = '';
			control._lexicalPaneLabelMain.innerHTML = 'COMPARE<br>SPECIES';
			control._lexicalPaneLabelMain.style.color = '#909090';
			control._lexicalPaneLabelMain.style.fontSize = '10pt';
			control._lexicalPaneLabelMain.style.lineHeight = '18px';
		} else if(whichCompare === 'lexical') {
			jQuery('.compare-distribution').animate({
				width: '125px'
			});
			control._distributionPaneLabelTop.innerHTML = '';
			control._distributionPaneLabelMain.innerHTML = 'COMPARE DISTRIBUTION';
			control._distributionPaneLabelMain.style.color = '#909090';
			control._distributionPaneLabelMain.style.fontSize = '10pt';
			control._distributionPaneLabelMain.style.lineHeight = '18px';
			if(control._distributionDropdownOne !== undefined) {
				control._distributionDropdownOne.remove();
				control._distributionDropdownOne = undefined;
				control._distributionResultsListOne.remove();
				control._distributionDropdownOne = undefined;
				control._distributionDropdownTwo.remove();
				control._distributionDropdownOne = undefined;
				control._distributionResultsListTwo.remove();
				control._distributionDropdownOne = undefined;
			}
			jQuery('.compare-environment').animate({
				left: '370px',
				width: '125px',
			});
			control._environmentPaneLabelTop.innerHTML = '';
			control._environmentPaneLabelMain.innerHTML = 'COMPARE ENVIRONMENT';
			control._environmentPaneLabelMain.style.color = '#909090';
			control._environmentPaneLabelMain.style.fontSize = '10pt';
			control._environmentPaneLabelMain.style.lineHeight = '18px';
			if(control._environmentDropdownOne !== undefined) {
				control._environmentDropdownOne.remove();
				control._environmentDropdownOne = undefined;
				control._environmentResultsListOne.remove();
				control._environmentDropdownOne = undefined;
				control._environmentDropdownTwo.remove();
				control._environmentDropdownOne = undefined;
				control._environmentResultsListTwo.remove();
				control._environmentDropdownOne = undefined;
			}

			jQuery('.compare-lexical').animate({
				left: '515px',
				width: '720px',
			});
			control._lexicalPaneLabelTop.innerHTML = 'COMPARE WITH ...';
			control._lexicalPaneLabelMain.innerHTML = 'ANOTHER SPECIES IN THE PARK';
			control._lexicalPaneLabelMain.style.color = '#f5faf2';
			control._lexicalPaneLabelMain.style.fontSize = '16pt';
			control._lexicalPaneLabelMain.style.lineHeight = '25px';

			var compareLexBox = L.DomUtil.create('input', 'comp-lexical-box');
			compareLexBox.style.position = 'absolute';
			compareLexBox.style.top = '33px';
			compareLexBox.style.left = '275px';
			compareLexBox.placeholder = 'Type a species name';
			compareLexBox.oninput = function() {
				var evt = window.event;
				control._fuseSearch(evt.srcElement.value, lexResultsList, 1);
			}
			var lexResultsList = L.DomUtil.create('ul', 'init-lexical-results');
			lexResultsList.style.position = 'absolute';
			lexResultsList.style.top = '53px';
			lexResultsList.style.left = '275px';
			lexResultsList.style.width = '375px';
			lexResultsList.style.display = 'none';
			lexResultsList.style.margin = '0px';
			control._comparisonLexicalPane.appendChild(compareLexBox);
			control._comparisonLexicalPane.appendChild(lexResultsList);
			control._compareLexBox = compareLexBox;
			control._lexResultsList = lexResultsList;
		} else {
			jQuery('.compare-distribution').animate({
				width: '125px'
			});
			control._distributionPaneLabelTop.innerHTML = '';
			control._distributionPaneLabelMain.innerHTML = 'COMPARE DISTRIBUTION';
			control._distributionPaneLabelMain.style.color = '#909090';
			control._distributionPaneLabelMain.style.fontSize = '10pt';
			control._distributionPaneLabelMain.style.lineHeight = '18px';
			if(control._distributionDropdownOne !== undefined) {
				control._distributionDropdownOne.remove();
				control._distributionDropdownOne = undefined;
				control._distributionResultsListOne.remove();
				control._distributionDropdownOne = undefined;
				control._distributionDropdownTwo.remove();
				control._distributionDropdownOne = undefined;
				control._distributionResultsListTwo.remove();
				control._distributionDropdownOne = undefined;
			}
			jQuery('.compare-environment').animate({
				left: '370px',
				width: '125px',
			});
			control._environmentPaneLabelTop.innerHTML = '';
			control._environmentPaneLabelMain.innerHTML = 'COMPARE ENVIRONMENT';
			control._environmentPaneLabelMain.style.color = '#909090';
			control._environmentPaneLabelMain.style.fontSize = '10pt';
			control._environmentPaneLabelMain.style.lineHeight = '18px';
			if(control._environmentDropdownOne !== undefined) {
				control._environmentDropdownOne.remove();
				control._environmentDropdownOne = undefined;
				control._environmentResultsListOne.remove();
				control._environmentDropdownOne = undefined;
				control._environmentDropdownTwo.remove();
				control._environmentDropdownOne = undefined;
				control._environmentResultsListTwo.remove();
				control._environmentDropdownOne = undefined;
			}
			jQuery('.compare-lexical').animate({
				left: '515px',
				width: '105px',
			});
			if(control._compareLexBox !== undefined) {
				control._compareLexBox.remove();
				control._compareLexBox = undefined;
				control._lexResultsList.remove();
				control._lexResultsList = undefined;
			}
			control._lexicalPaneLabelTop.innerHTML = '';
			control._lexicalPaneLabelMain.innerHTML = 'COMPARE<br>SPECIES';
			control._lexicalPaneLabelMain.style.color = '#909090';
			control._lexicalPaneLabelMain.style.fontSize = '10pt';
			control._lexicalPaneLabelMain.style.lineHeight = '18px';
		}
	}
});
