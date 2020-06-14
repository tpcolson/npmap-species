#!/bin/bash

mapbox_user="${MB_USER_ENV}"
access_token="${MB_TOKEN_ENV}"
atlas_usr="atlas-user"

dataset_prefix="GRSM"
gdal_cmd="gdal_translate -of GTiff -a_nodata 0"
tile_cmd="gdal_translate -of MBTiles -a_nodata 0"
upload_cmd="mapbox --access-token $access_token upload"
geotiff_dir="./geotiffs"
outgeos_dir="./geotiffs/out"
mbtiles_dir="./mbtiles"
outtile_dir="./mbtiles/out"
uploadcmnds="./uploadcommands.sh"
ids_file="/app/npmap-species/atbirecords/ATBI_ids.txt"
ext="tif"
ext_mb="mbtiles"
on_prem_upload="scp -i ~/.ssh/to_mbgov_rsa.pem -o \"ProxyCommand ssh -i ~/.ssh/to_mbproxy_rsa.pem preston.provins@52.204.73.74 -W %h:%p\""
on_prem_dest="preston.provins@10.112.30.133:/data/atlas-server/mbtiles/"

cp /app/npmap-species/environmentallayers/*.asc $geotiff_dir
( cd $geotiff_dir && /app/npmap-species/backend/tilemillcode/convert_all_to_tiff.sh && rm $geotiff_dir/*.asc )

mkdir $geotiff_dir/out
mkdir -p $outtile_dir

echo "#!/bin/bash" > $uploadcmnds

while read line; do
	for sp in $line; do
		sp=${sp%.tif}
		color=${sp##*_}
		species_name=${sp%_*}
		id=$(printf "%07i" $(grep -iw $species_name $ids_file | cut -d' ' -f2))
		if [ "$sp" == "grp_spring_flowers" ]; then
			id="G1"
		fi
		echo $gdal_cmd $geotiff_dir/$sp\.$ext $outgeos_dir/$sp\.$ext >> $uploadcmnds
		echo $tile_cmd $geotiff_dir/$sp\.$ext $outtile_dir/$atlas_usr\.$id\_$color\.$ext_mb >> $uploadcmnds
		if [[ ! -z "${MB_USER_ENV}" ]]; then
			echo $upload_cmd $mapbox_user\.$dataset_prefix\_$id\_$color $outgeos_dir/$sp\.$ext >> $uploadcmnds
		fi
		if [[ ! -z "${ATLAS_UPL_ENV}" ]]; then
			echo "echo" $on_prem_upload $outtile_dir/$atlas_usr\.$id\_$color\.$ext_mb $on_prem_dest >> $uploadcmnds
		fi
	done
done <<< $(ls $geotiff_dir)

chmod +x $uploadcmnds
./$uploadcmnds
