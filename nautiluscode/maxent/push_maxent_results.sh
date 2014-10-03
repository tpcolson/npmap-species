#!/bin/sh

dest_dir=/lustre/medusa/lyu6/npmap-species/maxent_results
rm -rf $dest_dir
mkdir $dest_dir

for sp in $(ls maxent_results); do
   mkdir $dest_dir/$sp
   cp maxent_results/$sp/maxentResults.csv $dest_dir/$sp
done

git add $dest_dir
git commit -m "Created maxent_results/"
