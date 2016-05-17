rm environment_list.txt
for species in $(ls "maxent_results");
	do python make_environment.py $species >> environment.txt;
done;
