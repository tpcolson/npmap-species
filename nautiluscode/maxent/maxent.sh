#!/bin/sh
export RUN_DIR=/lustre/medusa/lyu6/alltaxa/maxent2
export TOOL_DIR=/lustre/medusa/lyu6/alltaxa/maxent2
export MAXENT_JAR=/lustre/medusa/lyu6/alltaxa/maxent2/maxent.jar
export ENV_DIR=/lustre/medusa/lyu6/alltaxa/maxent2/asc
export ACCOUNT=UT-TENN0033


/lustre/medusa/lyu6/alltaxa/maxent2/cv/setup_eden_maxent.sh
eden eden_maxent
