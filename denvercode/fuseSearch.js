/* NOTE: This is modified from the geocoder control provided by NPMap.js.  Please
 * see here -- https://github.com/nationalparkservice/npmap.js -- for more information
 * on licensing and documentation
 */
var control,
	FuseSearchControl = L.Control.extend({
	options: {
		position: 'topright'
	},
	initialize: function(options) {
		L.Util.setOptions(this, options);
		return this;
	},
	onAdd: function(map) {
		control = this;
		var container = L.DomUtil.create('div', 'leaflet-control-geocoder'),
			stopPropagation = L.DomEvent.stopPropagation;

		this._button = L.DomUtil.create('button', 'search', container);
		this._input = L.DomUtil.create('input', '', container);
		this._ul = L.DomUtil.create('ul', 'leaflet-control', container);
		L.DomEvent.disableClickPropagation(this._button);
		L.DomEvent.disableClickPropagation(this._input);
		L.DomEvent.disableClickPropagation(this._ul);
		L.DomEvent
			.on(this._button, 'click', this._selectFirst)
			.on(this._button, 'mousewheel', stopPropagation)
			.on(this._input, 'focus', function() {
				this.value = this.value;
			})
			.on(this._input, 'mousewheel', stopPropagation)
			.on(this._input, 'keydown', this._handleKeyDown)
			.on(this._input, 'keyup', this._handleKeyUp)
			.on(this._ul, 'mousewheel', stopPropagation);

		this._container = container;
		this._button.setAttribute('alt', 'Search');
		this._button.disabled = true;
		this._input.setAttribute('aria-activedescendant', null);
		this._input.setAttribute('aria-autocomplete', 'list');
		this._input.setAttribute('aria-expanded', false);
		this._input.setAttribute('aria-label', 'Geocode');
		this._input.setAttribute('aria-owns', 'geocoder_listbox');
		this._input.setAttribute('placeholder', 'Loading index, please wait');
		this._input.disabled = true;
		this._input.setAttribute('role', 'combobox');
		this._input.setAttribute('type', 'text');
		this._ul.setAttribute('id', 'geocoder_listbox');
		this._ul.setAttribute('role', 'listbox');

		this._initializeFuseIndex();
		return container;
	},
	onRemove: function(map) {
		// Do I need to do anything here?
	},
	_initializeFuseIndex: function() {
		jQuery.ajax({
			type: 'GET',
			url: 'https://api.github.com/repos/nationalparkservice/npmap-species/contents/atbirecords/index.json',
			dataType: 'json',
			success: function(data) {
				var contents = window.atob(data.content),
					index = jQuery.parseJSON(contents)['items'],
					options = {
						keys: ['search_tag', 'alt_tag'],
						threshold: 0.5
					}

				control._fuser = new Fuse(index, options);
				control._button.disabled = false;
				control._input.setAttribute('placeholder', 'Find a species or group');
				control._input.disabled = false;
			}
		});
	},
	_checkScroll: function() {
		if (this._selected) {
			var top = util.getPosition(this._selected).top,
				bottom = top + util.getOuterDimensions(this._selected).height,
				scrollTop = this._ul.scrollTop,
				visible = [
					scrollTop,
					scrollTop + util.getOuterDimensions(this._ul).height
				];

				if (top < visible[0]) {
					this._ul.scrollTop = top - 10;
				} else if (bottom > visible[1]) {
					this._ul.scrollTop = top - 10;
				}
		}
	},
	_clearResults: function() {
		this._ul.innerHTML = '';
		this._ul.scrollTop = 0;
		this._ul.style.display = 'none';
		this._input.setAttribute('aria-activedescendant', null);
		this._input.setAttribute('aria-expanded', false);
		this._selected = null;
	},
	_highlightFirst: function() {
		// highlight and change focus to first search option
	},
	_handleSelect: function(item) {
		// change map to selected one and clear the search and results
	},
	_selectFirst: function() {
		var liList = control._ul.getElementsByTagName('li');
		if(liList.length != 0) {
			control._handleSelect(liList[0]);
		}
	},
	_handleKeyDown: function(e) {
		var code = e.keyCode;

		if(code == 9 || code == 38 || code == 40) {
			L.DomEvent.preventDefault(e);
			control._highlightFirst();
		} else if(code == 13) {
			control._selectFirst();
		} else if(code == 27) {
			control._clearResults();
			control._input.value = '';
		}
	},
	_handleKeyUp: function(e) {
		var code = e.keyCode;

		if(code != 9 && code != 13 && code != 38 && code != 40 && code != 27) {
			control._fuseSearch(control._input.value);
		}
	},
	_fuseSearch: function(value) {
		var results = control._fuser.search(value);

		control._clearResults();

		for(var i = 0; i < results.length; i++) {
			var res = results[i],
				li = L.DomUtil.create('li', null, control._ul);

			li.id = res.id;
			li.innerHTML = '<h1>' + res.name + '</h1>'; //TODO: add the thumbnail, sp name and common name here
			L.DomEvent.on(li, 'click', function() {
				control._handleSelect(this);
			});
		}

		control._ul.style.display = 'block';
		control._input.setAttribute('aria-expanded', true);
	}
});
