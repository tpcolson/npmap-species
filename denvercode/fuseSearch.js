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
			.on(this._input, 'blur', function() {
				control._input.value = '';
				control._clearResults();
			})
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
						keys: ['search_tag', 'alt_tag', 'group'],
						threshold: 0.5,
						sortFn: function(a, b) {
							//throw matched groups to the front and sort the rest based on score
							if(a.item.group == a.item.name && b.item.group == b.item.name) {
								return a.score - b.score;
							} else if(a.item.group == a.item.name) {
								return -1;
							} else if(b.item.group == b.item.name) {
								return 1;
							} else {
								return a.score - b.score;
							}
						}
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
			var top = utilGetPosition(this._selected).top,
				bottom = top + utilGetOuterDimensions(this._selected).height,
				scrollTop = this._ul.scrollTop,
				visible = [
					scrollTop,
					scrollTop + utilGetOuterDimensions(this._ul).height
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
	_highlightNext: function() {
		var liList = [].slice.call(control._ul.getElementsByTagName('li'));
		if(liList.length > 0) {
			if(control._selected)
				L.DomUtil.removeClass(control._selected, 'selected');

			var curr_idx = liList.indexOf(control._selected),
				len = liList.length,
				idx = curr_idx < len-1 ? curr_idx+1 : len-1;
			control._selected = liList[idx];

			L.DomUtil.addClass(control._selected, 'selected');
			control._checkScroll();
		}
	},
	_highlightPrev: function() {
		var liList = [].slice.call(control._ul.getElementsByTagName('li'));
		if(liList.length > 0) {
			if(control._selected)
				L.DomUtil.removeClass(control._selected, 'selected');

			var curr_idx = liList.indexOf(control._selected),
				len = liList.length,
				idx = curr_idx > 0 ? curr_idx-1 : 0;
			control._selected = liList[idx];

			L.DomUtil.addClass(control._selected, 'selected');
			control._checkScroll();
		}
	},
	_handleSelect: function(item) {
		//select new species
		control._clearResults();
		control._input.value = '';
		control._input.blur();
	},
	_selectFirst: function() {
		var liList = control._ul.getElementsByTagName('li');
		if(liList.length > 0) {
			control._handleSelect(liList[0]);
		}
	},
	_handleKeyDown: function(e) {
		var code = e.keyCode;

		if(code === 9 || code === 38 || code === 40) {
			L.DomEvent.preventDefault(e);

			if(code === 38)
				control._highlightPrev();
			else
				control._highlightNext();
		} else if(code === 13) {
			if(control._input === document.activeElement)
				control._selectFirst();
			else
				control._handleSelect(control._selected);
		} else if(code === 27) {
			control._clearResults();
			control._input.value = '';
		}
	},
	_handleKeyUp: function(e) {
		var code = e.keyCode;

		if(code !== 9 && code !== 13 && code !== 27 && code !== 38 && code !== 40) {
			control._fuseSearch(control._input.value);
		} else {
			L.DomEvent.stopPropagation(e);
		}
	},
	_fuseSearch: function(value) {
		var results = control._fuser.search(value);

		control._clearResults();

		// put 10 top results in ul
		for(var i = 0; i < results.length && i < 10; i++) {
			var res = results[i],
				li = L.DomUtil.create('li', null, control._ul);

			li.style.height = '75px';
			li.id = res.id;

			if(res.name != res.group) {
				li.innerHTML = '<div style="height:100%"><div style="float:left; width:35%"><img style="width:100%; height:100%" src="Abies--fraseri.jpg"></img></div>' +
							   '<div style="float:left; width:5%; height:100%"></div>' +
							   '<div style="float:left; width:60%"><strong>' + res.name + '</strong><br>' +
							   (res.alt_name === '' ? 'Unknown' : res.alt_name) + '<br>' +
							   res.group + '</div></div>'; //TODO: add the actual thumbnails and common names
			} else {
				li.innerHTML = '<div style="height:100%"><div style="float:left; width:35%"><img style="width:100%; height:100%" src="Abies--fraseri.jpg"></img></div>' +
							   '<div style="float:left; width:5%; height:100%"></div>' +
							   '<div style="float:left; width:60%"><strong>' + res.name + '</strong><br>Group</div></div>'; //TODO: add the actual thumbnails and common names
			}

			L.DomEvent
				.on(li, 'click', function() {
					control._handleSelect(this);
				})
				.on(li, 'keydown', function(e) {
					if(e.keyCode === 13)
						control._handleSelect(this);
				});
		}

		control._ul.style.display = 'block';
		control._input.setAttribute('aria-expanded', true);
	}
});
