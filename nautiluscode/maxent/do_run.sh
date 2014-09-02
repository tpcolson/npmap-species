#!/bin/sh

# do_run.sh
#  this script will produce three other scripts which must be run sequentially:
#  preprocess.sh
#  maxent.sh
#  run_gather.sh
#  and visit.sh

if test $# -ne 1; then
   echo 'usage: do_run.sh records_file'
   exit 1
fi

# maybe put these in separate 'config' file
RUN_DIR=$(pwd)
TOOL_DIR=$(pwd)
RECORD_FILE=$1
MAXENT_JAR=$(pwd)/maxent.jar
ENV_DIR=$(pwd)/mxe
# can be 'all', 'jackknife', or 'combos'
ENV_PICK=all
CV=true
ACCOUNT=UT-TENN0033


# make pre-process script
echo "#!/bin/sh
export RUN_DIR=$RUN_DIR
export TOOL_DIR=$TOOL_DIR
export RECORD_FILE=$RECORD_FILE
export ACCOUNT=$ACCOUNT

" > preprocess.sh

if test $CV = false; then
   echo "$TOOL_DIR/separate_species.sh > counts.txt" >> preprocess.sh

else
   echo "$TOOL_DIR/cv/separate_species.sh > counts.txt" >> preprocess.sh
   echo "$TOOL_DIR/cv/setup_eden_folds.sh" >> preprocess.sh
   echo "eden eden_folds" >> preprocess.sh
fi

chmod u+x preprocess.sh

# make maxent script
echo "#!/bin/sh
export RUN_DIR=$RUN_DIR
export TOOL_DIR=$TOOL_DIR
export MAXENT_JAR=$MAXENT_JAR
export ENV_DIR=$ENV_DIR
export ACCOUNT=$ACCOUNT

" > maxent.sh

if test $CV = false; then
   echo "$TOOL_DIR/setup_eden_maxent.sh" >> maxent.sh

else
   echo "$TOOL_DIR/cv/setup_eden_maxent.sh" >> maxent.sh

fi
echo "eden eden_maxent" >> maxent.sh
chmod u+x maxent.sh


#if test $CV = true; then
   
   # make gather script
#fi
t_col=$(( 45 + $( ls $ENV_DIR | wc -l ) ))

echo "#!/bin/sh
export RUN_DIR=$RUN_DIR
export TOOL_DIR=$TOOL_DIR
export MAXENT_JAR=$MAXENT_JAR
export ENV_DIR=$ENV_DIR
export ACCOUNT=$ACCOUNT
export T_COL=$t_col

" > run_gather.sh
echo "for name in \$(ls maxent_results); do
   $TOOL_DIR/gather.sh \$name;
   $TOOL_DIR/gather_threshold.sh \$name;
   $TOOL_DIR/gather_env.sh \$name; 
   $TOOL_DIR/make_cv_file maxent_results/\$name/matrix.dat 10 > maxent_results/\$name/\$name.txt;
done
" >> run_gather.sh
chmod u+x run_gather.sh

# make visit script
echo "#!/bin/sh
export RUN_DIR=$RUN_DIR
export TOOL_DIR=$TOOL_DIR
export ACCOUNT=$ACCOUNT

" > visit.sh
if test $CV = true; then
   echo "$TOOL_DIR/make_filelist.sh > filelist" >> visit.sh
   echo "$TOOL_DIR/setup_eden_visit.sh" >> visit.sh
   echo "eden eden_visit" >> visit.sh
fi
chmod u+x visit.sh


