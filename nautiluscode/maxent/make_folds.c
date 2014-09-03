#include<stdio.h>
#include<time.h>
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
   char sample_file[512];
   char test_file[512];
   char training_file[512];
   FILE *test_fp, *training_fp;
   IS is;

   if(argc != 4) {
      printf("usage: make_folds species_name num_records\n");
      exit(1);
   }

   sprintf(sample_file, "by_species/%s.csv", argv[1], i);
   sscanf(argv[2], "%d", &num_records);
   sscanf(argv[3], "%d", &num_folds);

   coords = (Coord *)malloc(sizeof(Coord) * num_records);

   is = new_inputstruct(sample_file);
   get_line(is);                    // skip first line
   i = 0;
   while(get_line(is) >= 0) {
      sscanf(is->fields[1], "%d", &coords[i].x);
      sscanf(is->fields[2], "%d", &coords[i].y);
      i++;
   }
   jettison_inputstruct(is);

   /*
   for(i = 0; i < num_records; i++) {
      printf("%d %d\n", coords[i].x, coords[i].y);
   }
   */

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

   for(i = 0; i < num_folds; i++) {
      printf("fold %d: size is %d\n", i, folds[i].size);
   }
   srand(time(NULL));
   
   // for each record, pick random fold for it to go in
   for(i = 0; i < num_records; i++) {
      //printf("%d\n", rand()%num_folds);
      retries = 0;
      candidate = rand() % num_folds;
      while(folds[candidate].next == folds[candidate].size) {
         retries++;
         candidate = rand() % num_folds;
      }
      folds[candidate].members[folds[candidate].next] = i;
      folds[candidate].next++;

      //printf("retries: %d\n", retries);
      //printf("\n");
   }

   // now for each fold, make test file and training file
   // (test file contains only the 10% in the fold, training file contains
   //  all of the records EXCEPT the 10%)
   for(i = 0; i < num_folds; i++) {
      sprintf(test_file, "test/%s_%d.csv", argv[1], i);
      sprintf(training_file, "training/%s_%d.csv", argv[1], i);
      //printf("%s  %s\n", test_file, training_file);
      test_fp = fopen(test_file, "w");
      training_fp = fopen(training_file, "w");
      fprintf(test_fp, "Species,x,y\n");
      fprintf(training_fp, "Species,x,y\n");

      start = 0;
      for(j = 0; j < folds[i].next; j++) {
         for(k = start; k < folds[i].members[j]; k++) {
            //printf("writing %d to training file\n", k);
            fprintf(training_fp, "%s,%d,%d\n", argv[1], coords[k].x,
                  coords[k].y);

         }
         //printf("  writing %d to test file\n", k);
         fprintf(test_fp, "%s,%d,%d\n", argv[1], coords[k].x, coords[k].y);
         start = k + 1;
      }
      // get remainder
      for(k = start; k < num_records; k++) {
         //printf("writing %d to training file\n", k);
         fprintf(training_fp, "%s,%d,%d\n", argv[1], coords[k].x,
               coords[k].y);
      }
      //printf("\n");
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



   
   
