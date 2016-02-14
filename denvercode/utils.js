var fuser = undefined,
  selectedSpecies = undefined;

loadResource('http://nationalparkservice.github.io/npmap-species/atbirecords/lexical_index.json', function(data) {
  var index = data.items,
    options = {
      keys: ['common_name'],
      threshold: 0.3
    };

  fuser = new Fuse(index, options);
});

window.onload = function() {
  attemptExecute(function() {
    if($('.leaflet-top.leaflet-left').get(0) === undefined) {
      return false;
    }

    $('.leaflet-top.leaflet-left').css({'top':'30px'});
    return true;
  });
}

function attemptExecute(fn) {
  if(!fn()) {
    setTimeout(fn, 50);
  }
}

function loadResource(url, callback) {
  loadResourceWithTries(url, callback, 1);
}

function loadResourceWithTries(url, callback, tries) {
  jQuery.ajax({
    type: 'GET',
    url: url,
    dataType: 'json',
    success: callback,
    error: function() {
      if(tries < 5) {
        loadResourceWithTries(url, callback, tries+1);
      }
    }
  });
}

function fuseSearch(val) {
  if(fuser !== undefined) {
    results = fuser.search(val).slice(0, 15);

    /* remove unspecified */
    var j = 15;
    for(var i = 0; i < results.length; i++) {
      if(results[i].common_name === 'Unspecified') {
        while(results[j].common_name === 'Unspecified') {
          j++;
        }
        results[i] = results[j];
        j++;
      }
    }

    /* expand ul */
    $('#sp-search-results').stop();
    $('#sp-search-results').animate({height: (results.length*20) + 'px'});

    /* add lis */
    $('#sp-search-results').html('');
    for(var i = 0; i < results.length; i++) {
      var li = document.createElement('li');
      li._latin = results[i].latin_name;
      li._id = results[i].irma_id;
      li._common = results[i].common_name;
      li.innerHTML = li._common.replace(/_/g, ' ');
      li.title = li._latin.replace(/_/g, ' ');
      li.onclick = function() {
        if(selectedSpecies !== undefined) {
          NPMap.config.L.removeLayer(selectedSpecies.observed);
        }

        selectedSpecies = {};
        selectedSpecies._id = this._id;
        selectedSpecies._latin = this._latin;
        selectedSpecies._common = this._common;
        selectedSpecies.visible = true;

        selectedSpecies.observed = L.npmap.layer.geojson({
          name: this._latin + '_observations',
          url: 'https://nps-grsm.cartodb.com/api/v2/sql?filename=' + this._latin + '&format=geojson&q=SELECT+DISTINCT+ON+(the_geom)+*+FROM+grsm_species_observations_maxent+WHERE+lower(genus_speciesmaxent)=lower(%27' + this._latin + '%27)',
          type: 'geojson',
          popup: {
            title: 'Common: ' + this._common.replace(/_/g, ' ') + "<br>"
              + 'Latin: ' + this._latin.replace(/_/g, ' '),
            description: 'This observation was recorded on '
              + '{{dateretrieved}}, at {{lon}}&#176;, {{lat}}&#176;, {{elevation}} feet '
              + 'in {{parkdistrict}}. It is best accessed by {{road}} and {{trail}}.<br><br>'
              + 'Download observations: '
              + '<a href="https://nps-grsm.cartodb.com/api/v2/sql?filename=' + this._latin + '&format=csv&q=SELECT+DISTINCT+ON+(the_geom)+*+FROM+grsm_species_observations_maxent+WHERE+lower(genus_speciesmaxent)=lower(%27' + this._latin + '%27)">CSV</a> | '
              + '<a href="https://nps-grsm.cartodb.com/api/v2/sql?filename=' + this._latin + '&format=kml&q=SELECT+DISTINCT+ON+(the_geom)+*+FROM+grsm_species_observations_maxent+WHERE+lower(genus_speciesmaxent)=lower(%27' + this._latin + '%27)">KML</a> | '
              + '<a href="https://nps-grsm.cartodb.com/api/v2/sql?filename=' + this._latin + '&format=geojson&q=SELECT+DISTINCT+ON+(the_geom)+*+FROM+grsm_species_observations_maxent+WHERE+lower(genus_speciesmaxent)=lower(%27' + this._latin + '%27)">GeoJSON</a> | '
              + '<a href="https://nps-grsm.cartodb.com/api/v2/sql?filename=' + this._latin + '&format=shp&q=SELECT+DISTINCT+ON+(the_geom)+*+FROM+grsm_species_observations_maxent+WHERE+lower(genus_speciesmaxent)=lower(%27' + this._latin + '%27)">SHP</a>'
              + '<br><br><a target="_blank" href="http://www.nps.gov/grsm/learn/nature/research.htm">Contribute to this dataset</a>'
          },
          tooltip: this._common.replace(/_/g, ' '),
          styles: {
            point: {
              'marker-color': '#c91892',
              'marker-size': 'medium'
            }
          },
          cluster: {
            clusterIcon: '#c91892'
          },
          disableClusteringAtZoom: 15,
          polygonOptions: {
            color: '#c91892',
            fillColor: '#c91892'
          }
        }).addTo(NPMap.config.L);

        $('#sp-search-input').val('');
        fuseSearch('');
      }

      document.getElementById('sp-search-results').appendChild(li);
    }
  }
}
