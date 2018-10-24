#!/bin/bash

mapbox_user="mahmadza"
dataset_prefix="GRSM"
access_file="secret_moa3.txt"
access_token=$(cat $access_file)
gdal_cmd="gdal_translate -of GTiff -a_nodata 0"
upload_cmd="mapbox --access-token $access_token upload"
geotiff_dir="./geotiffs"
ext="tif"

while read line; do
	for sp in $line; do
		sp=${sp%.png}
		color="c1" #${sp##*_}
		species_name=${sp%_*}
		$gdal_cmd $geotiff_dir/$sp\.png $geotiff_dir/$sp"_c1"\.$ext
		$upload_cmd $mapbox_user\.$dataset_prefix\_$color $geotiff_dir/$sp"_c1"\.$ext
	done
done <<< $(ls $geotiff_dir)
