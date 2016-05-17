#!/bin/bash

if test $# -ne 1; then
   echo 'usage: create_projects.sh root_dir'
   exit 1
fi

dataset_prefix="GRSM"
name_template=place_holder_name
file_template=place_holder.tif

mapbox_dir=${1%/}/mapbox
geotiff_dir=${1%/}/geotiffs
project_dir=$mapbox_dir/project
template_dir=$project_dir/template

while read line; do
   for sp in $line; do
      sp=${sp%.tif}
      species_dir=$project_dir/$sp
      project_file=$species_dir/project.mml
      layers_dir=$species_dir/layers
      geotiff_path=$layers_dir/species_data.tif
      
      rm -rf $species_dir
      mkdir $species_dir
      mkdir $layers_dir
      cp $template_dir/*.* $species_dir/
      rm -f $geotiff_path
      cp $geotiff_dir/$sp\.tif $geotiff_path
      sed -i "s/$name_template/$sp/" $project_file
      sed -i "s/$file_template/layers\/species_data.tif/" $project_file
   done
done <<< $(ls $geotiff_dir)
