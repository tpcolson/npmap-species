#!/bin/sh

. /usr/share/modules/init/bash
module load eden
./do_run.sh speciesSubset.csv 10
./preprocess.sh
./maxent.sh
./postprocess.sh
