#!/bin/bash

cp /app/data/ENVIRONMENTS.zip /app/npmap-species/ && cd /app/npmap-species/ && unzip ENVIRONMENTS.zip -d environmentallayers/

cd /app/npmap-species/environmentallayers && ./convert_asc_to_mxe.sh

cd /app/npmap-species/backend/maxent/ && ./clean.sh

cd /app/npmap-species/backend/maxent/ && ./run.sh

cd /app/npmap-species/backend/maxent/eden_folds/ && . commands

cd /app/npmap-species/backend/maxent/eden_maxent/ && parallel < commands

cd /app/npmap-species/backend/maxent/eden_aggregate/ && source /app/npmap-species/backend/maxent/eden_aggregate/commands

cd /app/npmap-species/backend/maxent && /app/npmap-species/backend/tilemillcode/upload_projects.sh

output_dir=/app/data/output
maxent_dir=/app/npmap-species/backend/maxent
if [[ ! -z ${DUMP_ENV} ]]; then
	mkdir ${output_dir}

	mkdir ${output_dir}/geotiffs
	cp ${maxent_dir}/geotiffs/out/*.tif ${output_dir}/geotiffs

	mkdir ${output_dir}/maxentresults
	cp -r ${maxent_dir}/maxent_results/* ${output_dir}/maxent_results
fi
