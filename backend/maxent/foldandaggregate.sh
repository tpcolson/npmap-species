#!/bin/bash
cd /app/npmap-species/backend/maxent/eden_folds/ && . commands
cd /app/npmap-species/backend/maxent/eden_maxent/ && parallel < commands
cd /app/npmap-species/backend/maxent/eden_aggregate/ && source /app/npmap-species/backend/maxent/eden_aggregate/commands
