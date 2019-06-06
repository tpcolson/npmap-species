#!/bin/bash

mapbox_user="${MB_USER_ENV}"
access_token="${MB_TOKEN_ENV}"

dataset_prefix="GRSM"
gdal_cmd="gdal_translate -of GTiff -a_nodata 0"
upload_cmd="mapbox --access-token $access_token upload"
geotiff_dir="./geotiffs"
outgeos_dir="./geotiffs/out"
uploadcmnds="./uploadcommands.sh"
ids_file="/app/npmap-species/atbirecords/ATBI_ids.txt"
ext="tif"

cp /app/npmap-species/environmentallayers/*.asc $geotiff_dir
( cd $geotiff_dir && /app/npmap-species/backend/tilemillcode/convert_all_to_tiff.sh && rm $geotiff_dir/*.asc )

mkdir $geotiff_dir/out

echo "#!/bin/bash" > $uploadcmnds

while read line; do
	for sp in $line; do
		sp=${sp%.tif}
		color=${sp##*_}
		species_name=${sp%_*}
		id=$(printf "%07i" $(grep -iw $species_name $ids_file | cut -d' ' -f2))
		echo $gdal_cmd $geotiff_dir/$sp\.$ext $outgeos_dir/$sp\.$ext >> $uploadcmnds
		if [[ ! -z "${MB_USER_ENV}" ]]; then
			echo $upload_cmd $mapbox_user\.$dataset_prefix\_$id\_$color $outgeos_dir/$sp\.$ext >> $uploadcmnds
		fi
	done
done <<< $(ls $geotiff_dir)

chmod +x $uploadcmnds
./$uploadcmnds
