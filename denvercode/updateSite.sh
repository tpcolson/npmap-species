#!/bin/bash
# push changes to public host for species mapper
# author: John Duggan
# email: jduggan1@vols.utk.edu
# date: August 2, 2015

# set up (you'll want to change this)
INDEX="index.html"
PUB_FILES=("style.css" "colorLegend.js" "fuseSearch.js" "mapping.js" "print.js"
           "scrollUtil.js" "searchTool.js" "utils.js")
PRIV_FILES=("updateRepo.py")
USER="jduggan1"
TAR_HOST="seelab.eecs.utk.edu"
TAR_DIR="/export/home/seelab/huangj/seelabwww/species_mapper"

# let's copy over the files to the site
scp ${INDEX} "${PUB_FILES[@]}" "${PRIV_FILES[@]}" ${USER}@${TAR_HOST}:${TAR_DIR}

# change file permissions as appropriate (also rename index)
ssh ${USER}@${TAR_HOST} << ENDSSH
	chmod 644 ${TAR_DIR}/${INDEX}
	for file in "${PUB_FILES[@]}"
	do
		chmod 644 ${TAR_DIR}/$file
	done
	chmod 755 ${TAR_DIR}
ENDSSH
exit
