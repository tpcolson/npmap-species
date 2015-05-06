#!/bin/bash

if test $# -ne 2; then
   echo 'usage: create_projects.sh mapbox_directory geotiff_directory'
   exit 1
fi

dataset_prefix="GRSM"
name_template=$dataset_prefix\_template
geotiff_template=Abies_fraseri_colored.tif

mapbox_dir=${1%/}
project_dir=$mapbox_dir/project
template_dir=$project_dir/template
geotiff_symlink=$template_dir/templatecolored.tif
#geotiff_path=$(readlink $geotiff_symlink | sed -r "s|/[^/]+$|/$sp|")
geotiff_dir=${2%/}

while read line; do
   for sp in $line; do
      sp=${sp%.tif}
      species_dir=$project_dir/$sp
      project_file=$species_dir/project.mml
      layers_dir=$species_dir/layers
      geotiff_symlink=$layers_dir/templatecolored.tif
      
      rm -rf $species_dir
      mkdir $species_dir
      mkdir $layers_dir
      cp $template_dir/*.* $species_dir/
      rm -f $geotiff_symlink
      ln -s $geotiff_dir/$sp\.tif $geotiff_symlink
      sed -i "s|$name_template|$dataset_prefix\_$sp|" $project_file
      sed -i "s|$geotiff_template|$sp\.tif|" $project_file
   done
done <<< $(ls $geotiff_dir)
