#!/bin/sh

if test $# -ne 2; then
   echo 'usage: tar_maxent_results.sh maxent_results_directory tarfile.tar.gz'
   exit 1
fi

file=maxentResults.csv
results_dir=$1
results_dir=${results_dir%/}

filelist=""

while read line; do
   for sp in $line; do
      filelist+=$results_dir/$sp/$file" "
   done
done <<< $(ls $results_dir)
tar zcf $2 $filelist