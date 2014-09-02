#!/bin/sh

if test $# -ne 1; then
   echo 'usage: gather.sh species_name'
   exit 1
fi

sp=$1
#TOOL_DIR=/nics/a/home/simmerma/summit/tools
#TOOL_DIR=/lustre/medusa/lyu6/alltaxa/maxent2
RESULTS_DIR=maxent_results
#ENV_DIR=$(pwd)/mxe

#t_col=$(( 45 + $(ls $ENV_DIR | wc -l) ))

# NEED TO MAKE THIS CONFIGURABLE
NUM_FOLDS=10

cd $RESULTS_DIR/$sp

# make filelist of 10 dat files
#echo "$sp: generating ssi matrix"
i=0
while test $i -lt $NUM_FOLDS; do
   # get threshold, field 55
   eval "t=\$(grep \$sp fold\$i/*Results.csv | awk -F',' '{print \$$T_COL}')"
   echo fold$i/$sp.dat $t
   i=$(($i + 1))
done > filelist


# run ssi with only 2 threads
#$TOOL_DIR/ssi 10 filelist 2
$TOOL_DIR/ssi $NUM_FOLDS filelist 2

rm filelist

#echo "$sp: generating summary maps"
$TOOL_DIR/summarize $sp > sd_stats.txt

# make cat of Results files
#echo "$sp: concatenating results files"
cp fold0/${sp}Results.csv maxentResults.csv
i=1
while test $i -lt $NUM_FOLDS; do
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
