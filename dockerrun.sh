#!/bin/bash

cp /app/data/ENVIRONMENTS.zip /app/npmap-species/ && cd /app/npmap-species/ && unzip ENVIRONMENTS.zip -d environmentallayers/

cd /app/npmap-species/environmentallayers && ./convert_asc_to_mxe.sh

cd /app/npmap-species/backend/maxent/ && ./clean.sh

cd /app/npmap-species/backend/maxent/ && ./run.sh

cd /app/npmap-species/backend/maxent/eden_folds/ && . commands

cd /app/npmap-species/backend/maxent/eden_maxent/ && parallel < commands

cd /app/npmap-species/backend/maxent/eden_aggregate/ && source /app/npmap-species/backend/maxent/eden_aggregate/commands

cd /app/npmap-species/backend/maxent && /app/npmap-species/backend/tilemillcode/upload_projects.sh
