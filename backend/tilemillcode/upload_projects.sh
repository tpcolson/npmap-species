#!/bin/bash

if test $# -ne 5; then
   echo 'usage: upload_projects.sh mapbox-upload_command mapbox_access_token mapbox_directory geotiff_directory IDs_file'
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
ids_file=$5

echo $(date) > upload_start_time.txt
echo $(date +%s) > upload_start_secs.txt

while read line; do
   for sp in $line; do
      sp=${sp%.tif}
      species_name=${sp%_*}
      id=$(grep -w $species_name $ids_file | cut -d' ' -f2)
      $upload_cmd $mapbox_user\.$dataset_prefix\_$id $export_dir/$sp\.$file_ext
   done
done <<< $(ls $geotiff_dir)

echo $(date) > upload_stop_time.txt
echo $(date +%s) > upload_stop_secs.txt