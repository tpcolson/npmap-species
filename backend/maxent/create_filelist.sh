#!/bin/sh

if test $# -ne 2; then
   echo 'usage: create_filelist.sh maxent_results_directory filelist'
   exit 1
fi

results_dir=${1%/}

while read line; do
   for sp in $line; do
      sd_mean=$(cut -d' ' -f 2 $results_dir/$sp/sd_stats.txt)
      echo $results_dir/$sp/$sp\_avg.dat $sd_mean
   done
done <<< $(ls $results_dir) > $2
