#!/bin/bash

if test $# -ne 4; then
   echo 'usage: create_projects.sh mapbox-upload_command mapbox_access_token mapbox_directory geotiff_directory'
   exit 1
fi

mapbox_user="nps"
dataset_prefix="GRSM"
file_ext="mbtiles"

export MapboxAccessToken=$(cat $2)

upload_cmd=$1
mapbox_dir=${3%/}
export_dir=$mapbox_dir/export
geotiff_dir=${4%/}

echo $(date) > upload_start_time.txt
echo $(date +%s) > upload_start_secs.txt

while read line; do
   for sp in $line; do
      sp=${sp%.tif}
      $upload_cmd $mapbox_user\.$dataset_prefix\_$sp $export_dir/$sp\.$file_ext
   done
done <<< $(ls $geotiff_dir)

echo $(date) > upload_stop_time.txt
echo $(date +%s) > upload_stop_secs.txt