var thumbnailURL = `https://carto.nps.gov/user/nps-grsm/api/v2/sql?q=select%20imageurl,REPLACE(sciname,%27%20%27,%20%27_%27)%20as%20latin%20from%20%22nps-grsm%22.grsm_species_obs%20where%20imageurl%20%3C%3E%20%27%27and%20sciname=%27Pipilo%20erythrophthalmus%27%20limit%201`;

function getThumbnailURL(latinStr) {
  let newLatin = latinStr.replace('_', '%20');
  let thumbReqURL = `https://carto.nps.gov/user/nps-grsm/api/v2/sql?q=select%20imageurl,REPLACE(sciname,%27%20%27,%20%27_%27)%20as%20latin%20from%20%22nps-grsm%22.grsm_species_obs%20where%20imageurl%20%3C%3E%20%27%27and%20sciname=%27${newLatin}%27%20limit%201`;
  let thumbURL = '';
  $.ajax({
    url: thumbReqURL,
    type : "get",
    async: false,
    success : function(response) {
      if ('rows' in response && response.rows.length > 0) {
        thumbURL = response.rows[0].imageurl;
        split = thumbURL.split('/');
        if(!split.length) return;
        let galleryID = split[split.length - 1];
        thumbURL = `https://npgallery.nps.gov/GRSM/GetAsset/${galleryID}/thumbmedium.png?`;
      }
    },
    error: function() {
      console.log('whoops');
    }
  });
  thumbURL ? thumbURL : thumbURL = 'images/' + tax_json[latinStr] + '_110px.jpg';
  return thumbURL;
}