#!/bin/bash
# push changes to public host for species mapper
# author: John Duggan
# email: jduggan1@vols.utk.edu
# date: September 2, 2015

# set up (you'll want to change this)
PUB_FILES=("index.html" "style.css" "mapping.js" "utils.js" "searchUtils.js" "reset.css" "drawUtils.js" "colorLegend.js" "chardinjs.css" "chardinjs.min.js")
USER="jduggan1"
TAR_HOST="seelab.eecs.utk.edu"
TAR_DIR="/export/home/seelab/huangj/seelabwww/full"

# let's copy over the files to the site
scp "${PUB_FILES[@]}" "${PRIV_FILES[@]}" ${USER}@${TAR_HOST}:${TAR_DIR}
