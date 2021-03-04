#!/bin/sh
	export RUN_DIR=/app/npmap-species/backend/maxent
	export TOOL_DIR=/app/npmap-species/backend/maxent
	export CONFIG_FILE=/app/data/config.txt
	export MAXENT_JAR=/app/npmap-species/backend/maxent/maxent.jar
	export ENV_DIR=/app/npmap-species/environmentallayers/mxe
	export GDAL_BIN=/usr/bin
	export GEOTIFF_DIR=/app/npmap-species/backend/maxent/geotiffs
	export ACCOUNT=UT-TENN0241
	export CV_NUM_FOLDS=10

	
/app/npmap-species/backend/maxent/setup_eden_aggregate.sh
