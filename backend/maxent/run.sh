#!/bin/bash

echo $(date) > start_time.txt
echo $(date +%s) > start_secs.txt
#. /usr/share/modules/init/bash
# module load eden
./do_run.sh ; echo "do_run.sh exit code: " $?
./preprocess.sh ; echo "preprocess.sh exit code: "$?
./maxent.sh ; echo "maxent.sh exit code: " $?
./postprocess.sh ; echo "postprocess.sh exit code: " $?
#./visit.sh

#eval "qsub visit.pbs -W depend=afterok:$(cat current_eden_job.txt | grep nics.utk.edu) > current_eden_job.txt" && \
