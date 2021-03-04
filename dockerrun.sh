#!/bin/bash -ex
export SHELLOPTS

(cd /app/npmap-species/backend/maxent/libfdr/src && make)

(cd /app/npmap-species/backend/maxent && make)

cd /app/npmap-species/atbirecords && python3 separate.py JUST_COORDS

# cd /app/npmap-species/atbirecords && python3 makegroups.py

cd /app/npmap-species/backend/maxent/ && ./clean.sh

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
	mkdir -p ${output_dir}

	mkdir -p ${output_dir}/geotiffs
	cp ${maxent_dir}/geotiffs/out/*.tif ${output_dir}/geotiffs

	mkdir -p ${output_dir}/maxent_results
	cp -r ${maxent_dir}/maxent_results/* ${output_dir}/maxent_results
fi
