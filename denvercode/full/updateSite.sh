#!/bin/bash
# push changes to public host for species mapper
# author: John Duggan
# email: jduggan1@vols.utk.edu
# date: September 2, 2015

# set up (you'll want to change this)
PUB_FILES=("index.html" "style.css" "mapping.js")
USER="jduggan1"
TAR_HOST="seelab.eecs.utk.edu"
TAR_DIR="/export/home/seelab/huangj/seelabwww/full"

# let's copy over the files to the site
scp "${PUB_FILES[@]}" "${PRIV_FILES[@]}" ${USER}@${TAR_HOST}:${TAR_DIR}

# change file permissions as appropriate (also rename index)
ssh ${USER}@${TAR_HOST} << ENDSSH
	for file in "${PUB_FILES[@]}"
	do
		chmod 644 ${TAR_DIR}/$file
	done
	chmod 755 ${TAR_DIR}
ENDSSH
exit
