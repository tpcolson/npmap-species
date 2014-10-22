#!/bin/bash
# push changes to public host for twincreeks
# author: John Duggan (jduggan1@vols.utk.edu, but please just leave me be, hokay?)
# date: really early in the morning, Oct. something (the days are blending together)

# set up (you'll want to change this if you change the file info)
INDEX="twincreeks.html"
PUB_FILES=("twincreeks.css" "config_gen.js" "form_utils.js" "background.jpg")
PRIV_FILES=()
SRC_DIR="/home/jduggan1/npmap-species/twincreekscode"
TAR_DIR="/export/home/seelab/huangj/seelabwww/twincreeks"

# let's copy over the files to the site
# start with the index (it's the special case)
cp ${SRC_DIR}/${INDEX} ${TAR_DIR}/index.html
# now get the rest
for file in "${PUB_FILES[@]}" "${PRIV_FILES[@]}"
do
	cp ${SRC_DIR}/${file} ${TAR_DIR}/${file}
done

# change file permissions as appropriate
chmod 644 ${TAR_DIR}/index.html
for file in "${PUB_FILES[@]}"
do
	chmod 644 ${TAR_DIR}/${file}
done
