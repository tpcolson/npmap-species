#!/bin/bash

mapbox_user="nps"
dataset_prefix="GRSM"
access_file="secret.txt"
access_token=$(cat $access_file)
gdal_cmd="gdal_translate -of GTiff -a_nodata 0"
upload_cmd="mapbox --access-token $access_token upload"
geotiff_dir="./geotiffs"
outgeos_dir="./geotiffs/out"
ids_file="./ATBI_ids.txt"
ext="tif"

mkdir $outgeos_dir

while read line; do
	for sp in $line; do
		sp=${sp%.tif}
		color=${sp##*_}
		species_name=${sp%_*}
		id=$(printf "%07i" $(grep -iw $species_name $ids_file | cut -d' ' -f2))
		echo $gdal_cmd $geotiff_dir/$sp\.$ext $outgeos_dir/$sp\.$ext
		echo $upload_cmd $mapbox_user\.$dataset_prefix\_$id\_$color $outgeos_dir/$sp\.$ext
	done
done <<< $(ls $geotiff_dir)
