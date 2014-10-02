#include<stdio.h>
#include<time.h>
#include<string.h>
#include"fields.h"

/************************************************************************
  make_folds.c

    usage:  ./make_folds species_name num_records num_folds

    From a species records file in by_species/, this code will produce test
    and training files for cross validation runs.  For instance if num_folds
    is 10, it divides the records into 10 equally-sized partitions with points
    selected randomly for each partition.  For each partition, it produces
    a 'test' file with only the points in that partition, and a 'training'
    file with the points *not* in the partition.
************************************************************************/

typedef struct {
   int *members;
   int size;
   int next;
} Fold;

typedef struct {
   int x;
   int y;
} Coord;

int main(int argc, char **argv) {
   int num_records;
   int num_folds;
   int size, fold_size, remainder;
   int candidate, i, j, k;
   int start;
   int retries;
   Fold *folds;
   Coord *coords;
   char test_file[512];
   char training_file[512];
   char species_name[512];
   char *str;
   FILE *test_fp, *training_fp;
   IS is;

   if(argc != 4) {
      printf("usage: make_folds species_file num_records num_folds\n");
      exit(1);
   }

   is = new_inputstruct(argv[1]);
   if(is == NULL){
      printf("%s not found.\n", argv[1]);
	  exit(1);
   }
   sscanf(argv[2], "%d", &num_records);
   sscanf(argv[3], "%d", &num_folds);
   
   // Extract filename from species_file into species_name
   if(strchr(argv[1], '/') == NULL) sprintf(species_name, "%s", strtok(argv[1], "."));
   else{
      for(str = strtok(argv[1], "/"); strchr(str, '.') == NULL; str = strtok(NULL, "/")) ;
      sprintf(species_name, "%s", strtok(str, "."));
   }

   coords = (Coord *)malloc(sizeof(Coord) * num_records);
   
   get_line(is);                    // skip first line
   for(i = 0; get_line(is) >= 0; i++) {
      strtok(is->fields[0], ",");
      sscanf(strtok(NULL, ","), "%d", &coords[i].x);
      sscanf(strtok(NULL, ","), "%d", &coords[i].y);
   }
   jettison_inputstruct(is);

   fold_size = num_records / num_folds;
   remainder = num_records % num_folds;

   // make folds of proper size
   folds = (Fold *)malloc(sizeof(Fold) * num_folds);
   for(i = 0; i < num_folds; i++) {
      size = fold_size;
      if(remainder > 0) size++;
      remainder--;
      folds[i].size = size;
      folds[i].members = (int *)malloc(sizeof(int) * size);
      folds[i].next = 0;
   }

   srand(time(NULL));
   
   // for each record, pick random fold for it to go in
   for(i = 0; i < num_records; i++) {
      // printf("%d\n", rand()%num_folds);
      candidate = rand() % num_folds;
      for(retries = 0; folds[candidate].next == folds[candidate].size; retries++)
         candidate = rand() % num_folds;
      folds[candidate].members[folds[candidate].next] = i;
      folds[candidate].next++;

      // printf("retries: %d\n", retries);
      // printf("\n");
   }

   // now for each fold, make test file and training file
   // (test file contains only the 10% in the fold, training file contains
   //  all of the records EXCEPT the 10%)
   for(i = 0; i < num_folds; i++) {
      sprintf(test_file, "test/%s_%d.csv", species_name, i);
      sprintf(training_file, "training/%s_%d.csv", species_name, i);
      // printf("%s  %s\n", test_file, training_file);
      test_fp = fopen(test_file, "w");
      training_fp = fopen(training_file, "w");
      fprintf(test_fp, "Species,x,y\n");
      fprintf(training_fp, "Species,x,y\n");

      start = 0;
      for(j = 0; j < folds[i].next; j++) {
         for(k = start; k < folds[i].members[j]; k++) {
            // printf("writing %d to training file\n", k);
            fprintf(training_fp, "%s,%d,%d\n", species_name, coords[k].x,
                  coords[k].y);

         }
         // printf("  writing %d to test file\n", k);
         fprintf(test_fp, "%s,%d,%d\n", species_name, coords[k].x, coords[k].y);
         start = k + 1;
      }
      // get remainder
      for(k = start; k < num_records; k++) {
         // printf("writing %d to training file\n", k);
         fprintf(training_fp, "%s,%d,%d\n", species_name, coords[k].x,
               coords[k].y);
      }
      // printf("\n");
      fclose(test_fp);
      fclose(training_fp);

   }


   /*
   for(j = 0; j < num_folds; j++) {
      printf("%d:\n", j);
      for(k = 0; k < folds[j].next; k++) {
         printf("%d %d,%d\n", folds[j].members[k], 
            coords[folds[j].members[k]].x, 
            coords[folds[j].members[k]].y);
      }
      //printf("\n");
   }
   */
}



   
   
