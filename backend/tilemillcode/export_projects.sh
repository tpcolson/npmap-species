#!/bin/bash

if test $# -ne 2; then
   echo 'usage: create_projects.sh mapbox_directory geotiff_directory'
   exit 1
fi

echo $(date) > export_start_time.txt
echo $(date +%s) > export_start_secs.txt

mapbox_dir=${1%/}
export_dir=$mapbox_dir/export
geotiff_dir=${2%/}

export PATH=$HOME/nodejslocal/bin:$PATH
export PATH=$HOME/tilemill:$PATH

while read line; do
   for sp in $line; do
      sp=${sp%.tif}
      index.js export $sp $export_dir/$sp.mbtiles
   done
done <<< $(ls $geotiff_dir)

echo $(date) > export_stop_time.txt
echo $(date +%s) > export_stop_secs.txt