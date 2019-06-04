#!/bin/bash

echo "Enter mapbox user name:"
read mapbox_user
dataset_prefix="GRSM"
# access_file="secret.txt"
# access_token=$(cat $access_file)
echo "Enter mapbox auth key for user $mapbox_user:"
read access_token
gdal_cmd="gdal_translate -of GTiff -a_nodata 0"
upload_cmd="mapbox --access-token $access_token upload"
geotiff_dir="./geotiffs"
outgeos_dir="./geotiffs/out"
uploadcmnds="./uploadcommands.sh"
ids_file="/app/npmap-species/atbirecords/ATBI_ids.txt"
ext="tif"

mkdir $geotiff_dir/out

echo "#!/bin/bash" > $uploadcmnds

while read line; do
	for sp in $line; do
		sp=${sp%.tif}
		color=${sp##*_}
		species_name=${sp%_*}
		id=$(printf "%07i" $(grep -iw $species_name $ids_file | cut -d' ' -f2))
		echo $gdal_cmd $geotiff_dir/$sp\.$ext $outgeos_dir/$sp\.$ext >> $uploadcmnds
		echo $upload_cmd $mapbox_user\.$dataset_prefix\_$id\_$color $outgeos_dir/$sp\.$ext >> $uploadcmnds
	done
done <<< $(ls $geotiff_dir)

chmod +x $uploadcmnds
./$uploadcmnds
