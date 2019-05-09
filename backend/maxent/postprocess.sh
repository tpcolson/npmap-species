#!/bin/sh
export RUN_DIR=/app/npmap-species/backend/maxent
export TOOL_DIR=/app/npmap-species/backend/maxent
export CONFIG_FILE=/app/npmap-species/twincreekscode/maxent_config/config_8.txt
export MAXENT_JAR=/app/npmap-species/backend/maxent/maxent.jar
export ENV_DIR=/app/npmap-species/environmentallayers/mxe
export GDAL_BIN=/usr/bin
export GEOTIFF_DIR=/app/npmap-species/backend/maxent/geotiffs
export ACCOUNT=UT-TENN0241
export CV_NUM_FOLDS=10


echo 'Running setup_eden_aggregate.sh'
/app/npmap-species/backend/maxent/setup_eden_aggregate.sh
echo -n '#PBS -W depend=afterok:' >> eden_aggregate/header.pbs
cat current_eden_job.txt | grep nics.utk.edu >> eden_aggregate/header.pbs
echo 'Running eden job in eden_aggregate/'
eden eden_aggregate > current_eden_job.txt
