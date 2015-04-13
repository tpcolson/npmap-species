#!/bin/sh

if test $# -ne 1; then
   echo 'usage: create_filelist.sh maxent_results_directory'
   exit 1
fi

results_dir=$1
results_dir=${results_dir%/}
echo $results_dir

ls -1 $results_dir | 
while read line; do
   sd_mean=$(cut -d' ' -f 2 $results_dir/$line/sd_stats.txt)
   echo $results_dir/$line/$line\_avg.dat $sd_mean
done > filelist
