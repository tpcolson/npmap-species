#!/bin/sh
export RUN_DIR=/lustre/medusa/lyu6/alltaxa/maxent2
export TOOL_DIR=/lustre/medusa/lyu6/alltaxa/maxent2
export ACCOUNT=UT-TENN0033


/lustre/medusa/lyu6/alltaxa/maxent2/make_filelist.sh > filelist
/lustre/medusa/lyu6/alltaxa/maxent2/setup_eden_visit.sh
eden eden_visit
