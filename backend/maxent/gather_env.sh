#!/bin/sh

# given a species name, this script will look in the maxentResults.csv file
# for that species and compute averages for the env. layer contributions

sp=$1
dir=maxent_results
ENV_NUM=$(ls $ENV_DIR | wc -l)

env_cols=$(sed 's/,/\n/g' maxentResults.csv | grep -n contribution | cut -d':' -f1)

i=0
for col in $env_cols;do
    sum=0.0
    eval "contribs=\$(grep \$sp maxentResults.csv | awk -F',' '{print \$$col}')"
    for per in $contribs; do
        sum=$(echo "scale=4; $mean + $per" | bc -q)
    done
    #eval "mean=\$(echo \"scale=4; \$mean / $ENV_NUM.0\" | bc -q)"
    eval "sum$i=$sum"
    i=$(($i+1))
done
    
j=0
while test $j -lt $i; do
    eval "mean=\$(echo \"scale=4; \$sum$j / $i.0\" | bc -q)"
	echo $mean >> env_stats.txt
	j=$(($j+1))
done
    
