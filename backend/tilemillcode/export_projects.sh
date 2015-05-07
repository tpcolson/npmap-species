#!/bin/bash

if test $# -ne 3; then
   echo 'usage: create_projects.sh tilemill_directory mapbox_directory geotiff_directory'
   exit 1
fi

file_ext="mbtiles"

tilemill_dir=${1%/}
export_cmd='$tilemill_dir/index.js export'
mapbox_dir=${2%/}
export_dir=$mapbox_dir/export
geotiff_dir=${3%/}

echo $(date) > export_start_time.txt
echo $(date +%s) > export_start_secs.txt

rm -rf $export_dir/*.*

while read line; do
   for sp in $line; do
      sp=${sp%.tif}
      $export_cmd $sp $export_dir/$sp.$file_ext
   done
done <<< $(ls $geotiff_dir)

echo $(date) > export_stop_time.txt
echo $(date +%s) > export_stop_secs.txt