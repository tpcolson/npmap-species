#!/bin/sh
export RUN_DIR=/home/mahmadza/repos/npmap-species/backend/maxent
export TOOL_DIR=/home/mahmadza/repos/npmap-species/backend/maxent
export CONFIG_FILE=/home/mahmadza/repos/npmap-species/twincreekscode/maxent_config/config_all.txt
export MAXENT_JAR=/home/mahmadza/repos/npmap-species/backend/maxent/maxent.jar
export ENV_DIR=/home/mahmadza/repos/npmap-species/environmentallayers/mxe
export GDAL_BIN=/usr/bin
export GEOTIFF_DIR=/home/mahmadza/repos/npmap-species/backend/maxent/geotiffs
export ACCOUNT=UT-TENN0241
export CV_NUM_FOLDS=10


echo 'Running setup_eden_aggregate.sh'
/home/mahmadza/repos/npmap-species/backend/maxent/setup_eden_aggregate.sh
echo -n '#PBS -W depend=afterok:' >> eden_aggregate/header.pbs
cat current_eden_job.txt | grep nics.utk.edu >> eden_aggregate/header.pbs
echo 'Running eden job in eden_aggregate/'
eden eden_aggregate > current_eden_job.txt
