#!/bin/bash

if test $# -ne 2; then
   echo 'usage: create_projects.sh mapbox_directory geotiff_directory'
   exit 1
fi

mapbox_dir=${1%/}
project_dir=$mapbox_dir/project
template_dir=$project_dir/template
geotiff_symlink=$template_dir/templatecolored.tif
#geotiff_path=$(readlink $geotiff_symlink | sed -r "s|/[^/]+$|/$sp|")
geotiff_dir=${2%/}

# echo "project_dir="$project_dir
# echo "template_dir="$template_dir
# echo "geotiff_dir="$geotiff_dir

while read line; do
   for sp in $line; do
      sp=${sp%.tif}
      species_dir=$project_dir/$sp
      project_file=$species_dir/project.mml
      layers_dir=$species_dir/layers
      geotiff_symlink=$layers_dir/templatecolored.tif
      
      # echo "sp="$sp
      # echo "species_dir="$species_dir
      # echo "layers_dir="$layers_dir
      
      rm -rf $species_dir
      mkdir $species_dir
      mkdir $layers_dir
      cp $template_dir/*.* $species_dir/
      rm -rf $geotiff_symlink
      ln -s $geotiff_dir/$sp\.tif $geotiff_symlink
      sed -i "s|GRSM_template|GRSM_$sp|" $project_file
      sed -i "s|Abies_fraseri_colored.tif|$sp.tif|" $project_file
   done
done <<< $(ls $geotiff_dir)
