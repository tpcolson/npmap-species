#!/bin/sh

mkdir eden_folds

i=0
while read line; do
   sp=$(echo $line | cut -d' ' -f1)
   count=$(echo $line | cut -d' ' -f2)
   echo "cd $RUN_DIR; $TOOL_DIR/cv/make_folds $sp $count" >> eden_folds/commands
   i=$(($i + 1))
done < counts.txt

# calculate appropriate ncpus
if test $i -gt 64; then
   ncpus=64
else
   ncpus=$i
fi


   echo "#!/bin/sh
#PBS -l ncpus=$ncpus
#PBS -j oe
#PBS -N eden_folds
#PBS -A $ACCOUNT
" > eden_folds/header.pbs

