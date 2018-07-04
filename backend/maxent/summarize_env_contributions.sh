#!/bin/bash

if [ ! -d tmp ]; then
    mkdir tmp
fi
cat maxent_results/$(ls maxent_results/ | head -n1)/maxentResults.csv | head -n 1 | sed 's/,/\n/g' | grep -E "(cat_|con_)" | sed 's/ contribution//g' > tmp/layers.txt
counter=1
for i in `cat tmp/layers.txt`; do
    echo "$(
    for sp in `ls maxent_results`; do 
        contrib=0
        if [ -f maxent_results/$sp/env_stats.txt ]; then
            contrib=`cat maxent_results/$sp/env_stats.txt | head -n $counter | tail -n 1`
        fi
        echo $i $sp $contrib
    done;
    )" | sort -g -k 3 -r | head -n 10;
    counter=$(( counter+1 ))
done;
