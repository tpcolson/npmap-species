#!/bin/sh

# given a species name, this script will look in the maxentResults.csv file
# for that species and compute averages for the env. layer contributions

sp=$1
dir=maxent_results
ENV_NUM=$(ls $ENV_DIR | wc -l)

i=0

while test $i -lt $ENV_NUM; do
   mean=0.0
   field=$(($i + 12))
   eval "contribs=\$(grep \$sp \$dir/\$sp/maxentResults.csv | awk -F',' '{print \$$field}')"
   for per in $contribs; do
      mean=$(echo "scale=4; $mean + $per" | bc -q)
   done

   eval "mean=\$(echo \"scale=4; \$mean / $ENV_NUM.0\" | bc -q)"
   eval "n$i=$mean"
   i=$(($i+1))
done

i=0
echo $1
echo $1 > $dir/$sp/env_stats.txt
while test $i -lt $ENV_NUM; do
	eval "echo \$n$i >> \$dir/\$sp/env_stats.txt"
	i=$(($i+1))
done

#echo $1 $n0 $n1 $n2 $n3 $n4 $n5 $n6 $n7 $n8 $n9 $n10 $n11 > $dir/$sp/env_stats.txt
