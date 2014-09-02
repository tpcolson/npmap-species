#!/bin/sh
export RUN_DIR=/lustre/medusa/lyu6/alltaxa/maxent2
export TOOL_DIR=/lustre/medusa/lyu6/alltaxa/maxent2
export RECORD_FILE=speciesGreaterThanEqual30.csv
export ACCOUNT=UT-TENN0033


/lustre/medusa/lyu6/alltaxa/maxent2/cv/separate_species.sh > counts.txt
/lustre/medusa/lyu6/alltaxa/maxent2/cv/setup_eden_folds.sh
eden eden_folds
