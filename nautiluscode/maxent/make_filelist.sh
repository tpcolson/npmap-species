#!/bin/sh

for sp in $(ls maxent_results); do
   t=$(awk '{print $2}' maxent_results/$sp/t_stats.txt)
   echo "maxent_results/$sp/avg.dat $t"
done
