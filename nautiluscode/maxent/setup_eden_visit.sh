#!/bin/sh

# sets up command list for eden to do visit runs, making a map for each species


mkdir eden_visit
mkdir png

# while read line; do
   # sp=$(echo $line | cut -d'.' -f1 | cut -d'/' -f3)
   # sp=$(echo $line | cut -d'.' -f1 | cut -d'/' -f2)
   # dir=$(echo $line | cut -d'.' -f1 | cut -d'/' -f2)
   # threshold=$(echo $line | cut -d' ' -f2)

   # echo "visit -v 2.7.2 -noconfig -nowin -cli -s $TOOL_DIR/visit_map.py -species $sp -threshold $threshold" >> eden_visit/commands
   # i=$(( $i + 1 ))
# done < filelist

# calculate appropriate ncpus
i=$(ls -l $RECORDS_DIR | wc -l)
if test $i -gt 128; then
   ncpus=128
elif test $i -gt 32; then
   ncpus=$(( $i+ (8-$i)%8+8 ))
else
   ncpus=32
fi

echo -n "#!/bin/sh
#PBS -q analysis
#PBS -l ncpus=$ncpus,walltime=3:00:00
#PBS -j oe
#PBS -N eden_visit
#PBS -A $ACCOUNT
" > eden_visit/header.pbs

echo "module load visit" > eden_visit/footer.pbs
echo "i=0" > eden_visit/footer.pbs
echo "for f in $(ls $RECORDS_DIR); do" > eden_visit/footer.pbs
echo "   sp=$(echo $f | cut -d'.' -f1)" > eden_visit/footer.pbs
echo "   echo 'visit -v 2.7.2 -noconfig -nowin -cli -s $TOOL_DIR/visit_map.py -species $sp -threshold $(awk '{print $2}' maxent_results/$sp/t_stats.txt)' >> eden_visit/commands" > eden_visit/footer.pbs
echo "   i=$(( $i + 1 ))" > eden_visit/footer.pbs
echo "done" > eden_visit/footer.pbs