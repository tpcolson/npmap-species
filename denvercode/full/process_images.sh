#!/bin/bash

dir_name="species_images"
unzip -d $dir_name $1
cd $dir_name
mkdir "thumbnails"
for i in `ls -p | grep -v /`; do
    newname=`echo $i | sed -E 's/_[0-9]+[_a-zA-Z]*//g'`;
    mv $i $newname;
    convert $newname -resize x100 "thumbnails/$newname"
done;

