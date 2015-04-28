#!/bin/sh

# given a species name, this script will look in the maxentResults.csv file
# for that species and get the average threshold and the std. dev. of the 
# threshold; it writes these to a file: t_stats.txt

sp=$1
dir=maxent_results

#ENV_DIR=/lustre/medusa
#t_col=$(( 45 + $(ls $ENV_DIR | wc -l) ))

i=0
mean=0.0
lines=$(grep $sp $dir/$sp/maxentResults.csv)
for line in $lines; do
   eval "t$i=\$(echo \$line | awk -F',' '{print \$$T_COL}')"
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
echo $sp
echo $sp $mean $sd > $dir/$sp/t_stats.txt
