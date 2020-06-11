function createPopup(li) {
    console.log(li._latin + '&format=geojson&q=SELECT+DISTINCT+ON+(the_geom)+*+FROM+grsm_species_observations_maxent+WHERE+lower(genus_speciesmaxent)=lower(%27' + li._latin + '%27)');
    
    return L.npmap.layer.geojson({
        name: li._latin + '_observations',
        url: 'https://carto.nps.gov/grsm/api/v2/sql?filename=' + li._latin + '&format=geojson&q=SELECT+DISTINCT+ON+(the_geom)+*+FROM+grsm_species_observations_maxent+WHERE+lower(genus_speciesmaxent)=lower(%27' + li._latin + '%27)',
        type: 'geojson',
        popup: {
            title: 'Common: ' + li._common.replace(/_/g, ' ') + "<br>"
                + 'Latin: ' + li._latin.replace(/_/g, ' '),
            description: 'This observation was recorded on '
                + '{{dateretrieved}}, at {{lon}}&#176;, {{lat}}&#176;, {{elevation}} feet '
                + 'in {{parkdistrict}}. It is best accessed by {{road}} and {{trail}}.<br><br>'
                + 'Download observations: '
                + '<a href="https://carto.nps.gov/grsm/api/v2/sql?filename=' + li._latin + '&format=csv&q=SELECT+DISTINCT+ON+(the_geom)+*+FROM+grsm_species_observations_maxent+WHERE+lower(genus_speciesmaxent)=lower(%27' + li._latin + '%27)">CSV</a> | '
                + '<a href="https://carto.nps.gov/grsm/api/v2/sql?filename=' + li._latin + '&format=kml&q=SELECT+DISTINCT+ON+(the_geom)+*+FROM+grsm_species_observations_maxent+WHERE+lower(genus_speciesmaxent)=lower(%27' + li._latin + '%27)">KML</a> | '
                + '<a href="https://carto.nps.gov/grsm/api/v2/sql?filename=' + li._latin + '&format=geojson&q=SELECT+DISTINCT+ON+(the_geom)+*+FROM+grsm_species_observations_maxent+WHERE+lower(genus_speciesmaxent)=lower(%27' + li._latin + '%27)">GeoJSON</a> | '
                + '<a href="https://carto.nps.gov/grsm/api/v2/sql?filename=' + li._latin + '&format=shp&q=SELECT+DISTINCT+ON+(the_geom)+*+FROM+grsm_species_observations_maxent+WHERE+lower(genus_speciesmaxent)=lower(%27' + li._latin + '%27)">SHP</a>'
                + '<br><br><a target="_blank" href="https://www.nps.gov/grsm/learn/nature/research.htm">Contribute to this dataset</a>'
        },
        tooltip: li._common.replace(/_/g, ' '),
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
    });
}
