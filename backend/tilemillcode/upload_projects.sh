#!/bin/bash

mapbox_user="nps"
dataset_prefix="GRSM"
access_file=secret.txt
access_token=$(cat $access_file)
upload_cmd="mapbox --access-token $access_token upload"
geotiff_dir="./geotiffs"
ids_file="./ATBI_ids.txt"
file_ext="tif"

while read line; do
	for sp in $line; do
		sp=${sp%.tif}
		color=${sp##*_}
		species_name=${sp%_*}
		id=$(printf "%07i" $(grep -iw $species_name $ids_file | cut -d' ' -f2))
		$upload_cmd $mapbox_user\.$dataset_prefix\_$id\_$color $geotiff_dir/$sp\_$color\.$file_ext
	done
done <<< $(ls $geotiff_dir)
