#!/bin/sh

# assumes individual species record files are in by_species/
#
# makes 2 directories: eden_maxent and maxent_results
#
# for every species in by_species/, makes maxent command line
# also makes command for converting asc grid to bov
# resulting command file will be placed in eden_maxent/
#
# you will need to create header.pbs before you can do eden run


LOCAL=/nics/a/home/simmerma
STORAGE=/lustre/medusa/simmerma

samples_dir=$RUN_DIR/by_species
output_dir=$RUN_DIR/maxent_results

mkdir eden_maxent
mkdir maxent_results

# get number of commands
num=$(ls by_species | wc -l)

# get appropriate padding for dir numbers
pad=$(( $(echo $num | wc -c) - 1))

i=0
for f in $(ls by_species); do
   species=$(echo $f | cut -d'.' -f1)

   flags="togglelayertype=cat \
perspeciesresults=true \
askoverwrite=false \
visible=false \
skipifexists \
plots=false \
pictures=false \
writebackgroundpredictions=false \
removeduplicates=false \
autorun"

   dir_num=$(eval "printf \"%0${pad}d\" \$i")
	maxent_cmd="java -Xms2048m -Xmx2048m -XX:-UsePerfData -jar $MAXENT_JAR environmentallayers=$ENV_DIR samplesfile=$samples_dir/${species}.csv outputdirectory=$output_dir/$dir_num $flags"
   echo "mkdir -p $output_dir/$dir_num && $maxent_cmd && cd $output_dir/$dir_num && $TOOL_DIR/asc2bov $species.asc $species && rm $species.asc" >> eden_maxent/commands

   i=$(( $i + 1))
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

