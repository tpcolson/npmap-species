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
   aggregate_cmd="cd $RUN_DIR; export TOOL_DIR=$TOOL_DIR; export CV_NUM_FOLDS=$CV_NUM_FOLDS; $TOOL_DIR/aggregate.sh $species"
   bov2asc_cmd="$TOOL_DIR/bov2asc $input_dir/$species/${species}_avg > $input_dir/$species/${species}_avg.asc"
   gdal_translate_cmd="$GDAL_BIN/gdal_translate -a_srs EPSG:4326 $input_dir/$species/${species}_avg.asc $GEOTIFF_DIR/$species.tif"
   gdaldem_cmd_blue="$GDAL_BIN/gdaldem color-relief -alpha $GEOTIFF_DIR/$species.tif $TOOL_DIR/color_ramp_blue.txt $GEOTIFF_DIR/${species}_blue.tif"
   gdaldem_cmd_pink="$GDAL_BIN/gdaldem color-relief -alpha $GEOTIFF_DIR/$species.tif $TOOL_DIR/color_ramp_pink.txt $GEOTIFF_DIR/${species}_pink.tif"
   gdaldem_cmd_orange="$GDAL_BIN/gdaldem color-relief -alpha $GEOTIFF_DIR/$species.tif $TOOL_DIR/color_ramp_orange.txt $GEOTIFF_DIR/${species}_orange.tif"
   echo "$aggregate_cmd && $bov2asc_cmd && $gdal_translate_cmd && $gdaldem_cmd_blue; $gdaldem_cmd_pink; $gdaldem_cmd_orange" >> eden_aggregate/commands
done < $CONFIG_FILE

# Make PBS header file for eden run
echo -n "#!/bin/sh
#PBS -l size=32
#PBS -j oe
#PBS -N eden_aggregate
#PBS -A $ACCOUNT
#PBS -m e
#PBS -M lyu6@vols.utk.edu
" > eden_aggregate/header.pbs
