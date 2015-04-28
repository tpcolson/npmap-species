#!/bin/sh

if test $# -ne 2; then
   echo 'usage: create_min_auc_list.sh maxent_results_directory min_auc_list.txt'
   exit 1
fi

file=maxentResults.csv
results_dir=$1
results_dir=${results_dir%/}

while read line; do
   for sp in $line; do
      i=0
      min_auc=1
      while read row; do
         if test $i -eq 1; then
            min_auc=$(echo $row | cut -d',' -f6)
         elif test $i -gt 1; then
            auc=$(echo $row | cut -d',' -f6)
            if test $(echo $auc"<"$min_auc | bc) -eq 1; then
                min_auc=$auc
            fi
         fi
         i=$(( $i + 1 ))
      done < $results_dir/$sp/$file
      echo $sp $min_auc
   done 
done <<< $(ls $results_dir) > $2
