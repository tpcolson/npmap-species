#!/bin/sh

# sets up command list for eden to do visit runs, making a map for each species


mkdir eden_visit
mkdir png

i=0
while read line; do
   #sp=$(echo $line | cut -d'.' -f1 | cut -d'/' -f3)
   sp=$(echo $line | cut -d'.' -f1 | cut -d'/' -f2)
   #dir=$(echo $line | cut -d'.' -f1 | cut -d'/' -f2)
   threshold=$(echo $line | cut -d' ' -f2)

   echo "visit -v 2.7.2 -noconfig -nowin -cli -s $TOOL_DIR/visit_map.py -species $sp -threshold $threshold" >> eden_visit/commands
   i=$(( $i + 1 ))
done < filelist

# calculate appropriate ncpus
if test $i -gt 128; then
   ncpus=128
else
   ncpus=$i
fi

echo "#!/bin/sh
#PBS -l ncpus=$ncpus,walltime=3:00:00
#PBS -j oe
#PBS -N eden_visit
#PBS -A $ACCOUNT
module load visit
" > eden_visit/header.pbs

