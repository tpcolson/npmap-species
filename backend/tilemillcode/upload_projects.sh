#!/bin/bash

mapbox_user="${MB_USER_ENV}"
access_token="${MB_TOKEN_ENV}"
atlas_usr="atlas-user"

dataset_prefix="GRSM"
gdal_cmd="gdal_translate -of GTiff -a_nodata 0"
tile_cmd="gdal_translate -of MBTiles -a_nodata 0 -oo ZOOM_LEVEL=16"
post_cmd="gdaladdo -r nearest"
upload_cmd="mapbox --access-token $access_token upload"
geotiff_dir="./geotiffs"
outgeos_dir="./geotiffs/out"
mbtiles_dir="./mbtiles"
outtile_dir="./mbtiles/out"
uploadcmnds="./uploadcommands.sh"
ids_file="/app/npmap-species/atbirecords/ATBI_ids.txt"
ext="tif"
ext_mb="mbtiles"
on_prem_upload="scp -i /root/.ssh/to_mbgov_rsa.pem -o \x22ProxyCommand ssh -i /root/.ssh/to_mbproxy_rsa.pem preston.provins@52.204.73.74 -W %h:%p\x22"
on_prem_dest="preston.provins@10.112.30.103:/data/preston.provins-data-dump"
atlas_mv="ssh -i /root/.ssh/to_mbgov_rsa.pem -o \x22ProxyCommand ssh -i /root/.ssh/to_mbproxy_rsa.pem preston.provins@52.204.73.74 -W %h:%p\x22 sudo mv /data/preston.provins-data-dump/* /data/atlas-server/mbtiles/"
perms="chmod 755"

mkdir $geotiff_dir/out
mkdir -p $outtile_dir

rm $geotiff_dir/*.asc
rm $geotiff_dir/*.tif.aux.xml

echo "#!/bin/bash" > $uploadcmnds

echo "Host *" > ~/.ssh/config
echo "	StrictHostKeyChecking no" >> ~/.ssh/config
echo "	UserKnownHostsFile=/dev/null" >> ~/.ssh/config
chmod 400 ~/.ssh/config

while read line; do
	for sp in $line; do
		sp=${sp%.tif}
		color=${sp##*@}
		species_name=${sp%@*}
		id=$(printf "%07i" $(grep -iw $species_name $ids_file | cut -d' ' -f2))
		if [ {$species_name:0:3} == "grp" ]; then
			id="$species_name"
		fi
		echo $gdal_cmd $geotiff_dir/$sp\.$ext $outgeos_dir/$sp\.$ext >> $uploadcmnds
		echo $tile_cmd $geotiff_dir/$sp\.$ext $outtile_dir/$atlas_usr\.$id\_$color\.$ext_mb >> $uploadcmnds
		echo $post_cmd $outtile_dir/$atlas_usr\.$id\_$color\.$ext_mb "2 4 8 16" >> $uploadcmnds
		echo $perms $outtile_dir/$atlas_usr\.$id\_$color\.$ext_mb >> $uploadcmnds
		if [[ ! -z "${MB_USER_ENV}" ]]; then
			echo $upload_cmd $mapbox_user\.$dataset_prefix\_$id\_$color $outgeos_dir/$sp\.$ext >> $uploadcmnds
		fi
		if [[ ! -z "${ATLAS_UPL_ENV}" ]]; then
			echo -e $on_prem_upload $outtile_dir/$atlas_usr\.$id\_$color\.$ext_mb $on_prem_dest >> $uploadcmnds
		fi
	done
done <<< $(ls $geotiff_dir)

chmod +x $uploadcmnds
./$uploadcmnds


# on_prem_upload='scp -i /root/.ssh/to_mbgov_rsa.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o \"ProxyCommand ssh -i /root/.ssh/to_mbproxy_rsa.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null preston.provins@52.204.73.74 -W %h:%p\"'
# on_prem_dest="preston.provins@10.112.30.133:/data/preston.provins-data-dump"
