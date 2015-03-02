#!/bin/bash
# push changes to public host for twincreeks
# author: John Duggan
# email: jduggan1@vols.utk.edu
# date: really early in the morning, Oct. something (the days are blending together)

# set up (you'll want to change this if you change the file info)
INDEX="twincreeks.html"
PUB_FILES=("twincreeks.css" "config_gen.js" "form_utils.js" "send_email.js")
PRIV_FILES=("server.py" "socket_handler.py")
USER="jduggan1"
TAR_HOST="seelab.eecs.utk.edu"
TAR_DIR="/export/home/seelab/huangj/seelabwww/twincreeks"

# let's copy over the files to the site
scp ${INDEX} "${PUB_FILES[@]}" "${PRIV_FILES[@]}" ${USER}@${TAR_HOST}:${TAR_DIR}

# change file permissions as appropriate (also rename index)
ssh ${USER}@${TAR_HOST} << ENDSSH
	chmod 644 ${TAR_DIR}/${INDEX}
	mv ${TAR_DIR}/${INDEX} ${TAR_DIR}/index.html
	for file in "${PUB_FILES[@]}"
	do
		chmod 644 ${TAR_DIR}/$file
	done
	chmod 755 ${TAR_DIR}
ENDSSH
exit
