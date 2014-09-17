#!/bin/sh

# sets up command list for eden to do visit runs, making a map for each species


mkdir eden_visit
mkdir png

i=0
for f in $(ls by_species); do
   sp=$(echo $f | cut -d'.' -f1)
   echo "visit -v 2.7.2 -noconfig -nowin -cli -s $TOOL_DIR/visit_map.py -species $sp -threshold $(awk '{print $2}' maxent_results/$sp/t_stats.txt)" >> eden_visit/commands
   i=$(( $i + 1 ))
done

# while read line; do
   # sp=$(echo $line | cut -d'.' -f1 | cut -d'/' -f3)
   # sp=$(echo $line | cut -d'.' -f1 | cut -d'/' -f2)
   # dir=$(echo $line | cut -d'.' -f1 | cut -d'/' -f2)
   # threshold=$(echo $line | cut -d' ' -f2)

   # echo "visit -v 2.7.2 -noconfig -nowin -cli -s $TOOL_DIR/visit_map.py -species $sp -threshold $threshold" >> eden_visit/commands
   # i=$(( $i + 1 ))
# done < filelist

# calculate appropriate ncpus
if test $i -gt 128; then
   ncpus=128
else
   ncpus=$(( $i + (32-$i)%32 ))
fi

echo -n "#!/bin/sh
#PBS -l ncpus=$ncpus,feature=uv10,walltime=3:00:00
#PBS -j oe
#PBS -N eden_visit
#PBS -A $ACCOUNT
" > eden_visit/header.pbs

echo "module load visit" > eden_visit/footer.pbs