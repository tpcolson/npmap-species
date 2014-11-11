#!/bin/sh

# This should be called from postprocess.sh (which is created by do_run.sh)
# when you have cross-validated maxent results

# Create run directory for eden run
mkdir eden_aggregate
mkdir $GEOTIFF_DIR

input_dir=$RUN_DIR/maxent_results

# Make command list for running aggregate.sh on each species.
i=-1
while read line; do
   i=$(($i + 1))
   # Skip first line
   if test $i -eq 0; then continue; fi
   species=$line
   gdal_translate="$GDAL_BIN/gdal_translate -a_srs EPSG:4326 $input_dir/$species/avg.asc $GEOTIFF_DIR/$species.tif"
   gdaldem="$GDAL_BIN/gdaldem color-relief $GEOTIFF_DIR/$species.tif $TOOL_DIR/color_ramp.txt $GEOTIFF_DIR/${species}_colored.tif"
   echo "cd $RUN_DIR; export TOOL_DIR=$TOOL_DIR; export CV_NUM_FOLDS=$CV_NUM_FOLDS; $TOOL_DIR/aggregate.sh $species&& $gdal_translate $$ $gdaldem" >> eden_aggregate/commands
done < $CONFIG_FILE

# Make PBS header file for eden run
echo -n "#!/bin/sh
#PBS -l ncpus=32
#PBS -j oe
#PBS -N eden_aggregate
#PBS -A $ACCOUNT
#PBS -m e
#PBS -M lyu6@vols.utk.edu
" > eden_aggregate/header.pbs
