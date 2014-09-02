#!/bin/sh

# given a directory of species files, this script will make commands to run
#  maxent with manual 10-way cross-validation on each species using all 10
#  env. layers

# this is configured specifically for new_atbi




samples_dir=$RUN_DIR/training
output_dir=$RUN_DIR/maxent_results

mkdir eden_maxent
mkdir maxent_results

i=0
for f in $(ls by_species); do
   species=$(echo $f | cut -d'.' -f1)
   fold=0
   # NEED TO MAKE NUMBER OF FOLDS GENERAL
   while test $fold -lt 10; do

      flags="togglelayertype=cat \
perspeciesresults=true \
askoverwrite=false \
visible=false \
skipifexists \
plots=false \
pictures=false \
writebackgroundpredictions=false \
removeduplicates=false \
testsamplesfile=$RUN_DIR/test/${species}_${fold}.csv \
autorun"

	   maxent_cmd="java -Xms512m -Xmx512m -XX:-UsePerfData -jar $MAXENT_JAR environmentallayers=$ENV_DIR samplesfile=$samples_dir/${species}_$fold.csv outputdirectory=$output_dir/$species/fold$fold $flags"
      echo "mkdir -p $output_dir/$species/fold$fold && $maxent_cmd && cd $output_dir/$species/fold$fold && $TOOL_DIR/asc2bov $species.asc $species && rm $species.asc" >> eden_maxent/commands

      fold=$(($fold + 1))
      i=$(( $i + 1 ))
   done
done

# calculate appropriate ncpus
if test $i -gt 256; then
   ncpus=256
else
   ncpus=$i
fi

echo "#!/bin/sh
#PBS -l ncpus=$ncpus,walltime=3:00:00
#PBS -j oe
#PBS -N eden_maxent
#PBS -A $ACCOUNT
module load java
" > eden_maxent/header.pbs

