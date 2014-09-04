#!/bin/sh

if test $# -ne 1; then
   echo 'usage: aggregate.sh species_name'
   exit 1
fi

sp=$1

cd maxent_results/$sp

# Find column number of threshold value:
#   'Equal training sensitivity and specificity logistic'
t_col=$(sed 's/,/\n/g' fold0/*Results.csv | grep -n 'Equal training sensitivity and specificity logistic' | cut -d':' -f1)

# Run ssi comparison on all folds of a species
i=0
while test $i -lt $CV_NUM_FOLDS; do
   # get threshold value from maxent results file
   eval "t=\$(grep \$sp fold\$i/*Results.csv | awk -F',' '{print \$$t_col}')"
   echo fold$i/$sp.dat $t
   i=$(($i + 1))
done > filelist

$TOOL_DIR/ssi $CV_NUM_FOLDS filelist 2
rm filelist

# Aggregate all folds into one sdm and gather stats
$TOOL_DIR/summarize $sp $CV_NUM_FOLDS > sd_stats.txt

# Concatenate all Results files from folds into one
cp fold0/${sp}Results.csv maxentResults.csv
i=1
while test $i -lt $CV_NUM_FOLDS; do
   grep $sp fold$i/${sp}Results.csv >> maxentResults.csv
   i=$(($i + 1))
done

# rm -r all fold directories
#echo "$sp: cleaning up"
#i=0
#while test $i -lt 10; do
   #rm -r fold$i
   #i=$(($i + 1))
#done


# From this concatenated results file, get avg. and std.dev of threshold value
i=0
mean=0.0
lines=$(grep $sp maxentResults.csv)
for line in $lines; do
   eval "t$i=\$(echo \$line | awk -F',' '{print \$$t_col}')"
   eval "mean=\$(echo \"scale=4; \$mean + \$t$i\" | bc -q)"
   #eval "echo \$t$i  \$mean"
   i=$(($i + 1))
done 
#mean=$(echo "scale=4; $mean / 10.0" | bc -q)
eval "mean=\$(echo \"scale=4; \$mean / $i.0\" | bc -q)"

j=0
sd=0.0
while test $j -lt $i; do
   eval "d=\$(echo \"scale=6; (\$t$j - \$mean)*(\$t$j - \$mean)\" | bc -q)"
   #echo $d
   sd=$(echo "scale=6; $d + $sd" | bc -q)
   j=$(($j + 1))
done
sd=$(echo "scale=6; $sd / $i.0" | bc -q)
#echo $sp $mean $sd
#echo $sp
echo $sp $mean $sd > t_stats.txt


# Also from maxentResults, get average of environment contributions
env_cols=$(sed 's/,/\n/g' maxentResults.csv | grep -n contribution | cut -d':' -f1)

i=0
for col in $env_cols;do
    sum=0.0
    eval "contribs=\$(grep \$sp maxentResults.csv | awk -F',' '{print \$$col}')"
    for per in $contribs; do
        sum=$(echo "scale=4; $sum + $per" | bc -q)
    done
    eval "mean$i=\$(echo \"scale=4; \$sum / $CV_NUM_FOLDS.0\" | bc -q)"
    i=$(($i+1))
done
    
j=0
while test $j -lt $i; do
	eval "echo \$mean$j >> env_stats.txt"
	j=$(($j+1))
done
    
