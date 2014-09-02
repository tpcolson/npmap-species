/* ssi.c

   usage: ssi num_species file_list num_threads

   This program will use num_threads threads to read in num_species species 
   files from file_list; then it does all possible pair-wise comparisons,
   calculating a sorensen similarity index (ssi) value for each comparison;
   it then writes out the ssi values into a matrix in .bov format
   (ssi values are initially between 0 and 1; they are scaled to 0-255 so they
   can be represented as a single byte (unsigned char) in matrix)
   
   The file_list is in the form:
      /full/path/to/speciesfile0 threshold0
      /full/path/to/speciesfile1 threshold1
      ...
   The species files are bov grids output by the MaxEnt program of species
   predicted presences.  There are NO_DATA cells with the value -9999.  For
   each file read in, we only keep track of the indices of cells that have a 
   value greater than the threshold value for that particular species.
   The threshold value is scraped from the results file that maxent outputs.
*/

#include<stdio.h>
#include<stdlib.h>
#include<time.h>
#include"pthread.h"
#include"fields.h"
#include"get_5env.h"
#include<fcntl.h>

#define CHUNK 1

// function for reading in ascii env layers
grid *read_file(char *filename) {

    int i, j, n;
    int ncols, nrows, total, first;
    float min, max, cur;
    grid *g;
    IS is;

    is = new_inputstruct(filename);
    // need check for is == NULL
    if(is == NULL) {
       fprintf(stderr, "unable to open %s\n", filename);
       exit(1);
    }

    if(get_line(is) < 0) {
       fprintf(stderr, "problem reading %s\n", filename);
       exit(1);
    }
    sscanf(is->fields[1], "%d", &ncols);
    if(get_line(is) < 0) {
       fprintf(stderr, "problem reading %s\n", filename);
       exit(1);
    }
    sscanf(is->fields[1], "%d", &nrows);
    g = (grid *)malloc(sizeof(grid));
    g->a = (float *)malloc(sizeof(float) * ncols * nrows);
    g->ncols = ncols;
    g->nrows = nrows;

    // skip 4 lines
    for(i = 0; i < 4; i++) {
       if(get_line(is) < 0) {
          fprintf(stderr, "problem reading %s\n", filename);
          exit(1);
       }
    }
    total = 0;
    first = 1;
    for(i = 0; i < nrows; i++) {
        //printf("reading line %d: NF = %d\n", i+6, is->NF);
       if(get_line(is) < 0) {
          fprintf(stderr, "problem reading %s\n", filename);
          exit(1);
       }
       if(is->NF != ncols) {
          fprintf(stderr, "col number mismatch in %s\n", filename);
          exit(1);
       }
        for(j = 0; j < ncols; j++) {
           sscanf(is->fields[j], "%f", g->a +(i*ncols)+j);
        }
    }
    jettison_inputstruct(is);
    return g;
}

// function for thread reading in sdm and getting env stats
void *thread_read(void *arg) {

   t_info *ti;
   ti = (t_info *)arg;
   global *g;
   g = (global *)ti->g;
   int i, j, n;
   int ncols, nrows, total;
   species *sp;
   FILE *fp;
   float *buf;
   int chunk,num_read;
   float mean[5];
   float min[5];
   float max[5];
   char *ptr;

   ncols=2899;
   nrows=1302;
   chunk=1024*512;
   buf = (float *)malloc(sizeof(float)*ncols*nrows);

   //time(&ti->c1);
   while(1) {
      // obtain lock
      if(pthread_mutex_lock(g->mutex) != 0) {
         perror("pthread_mutex_lock"); exit(1);
      }
      // get next file to read
      n = g->next_read;

      // if done, clean up and exit
      if(n == g->num_species) {
         pthread_mutex_unlock(g->mutex);
         //time(&ti->c2);
         pthread_exit(NULL);
      }
      else g->next_read++;

      // release lock
      pthread_mutex_unlock(g->mutex);

      // for bookkeeping, keep track of how many files read for this thread
      ti->num_read++;

      sp = (species *)malloc(sizeof(species));
      // get species name from filename
      ptr = g->file_list[n] + strlen(g->file_list[n]) - 2;
      while(*ptr != '/') ptr--;
      ptr++;
      sp->name = strdup(ptr);

      fp = open(g->file_list[n], O_RDONLY);
    
      i=0;
      while((num_read = read(fp, buf+i, chunk)) == chunk) {
         i+=(chunk/4);
      }
      sp->indices = malloc(sizeof(int) * ncols * nrows);
   
      // build list of indices that have value > threshold
      total = 0;
      for(i = 0; i < nrows*ncols; i++) {
         if(buf[i] > g->thresholds[n]) {
            //printf("adding: %d  %f\n", i, buf[i]);
            sp->indices[total] = i;
            total++;
         }
      }
      close(fp);
      sp->count = total;

      // go through list of indices and get env values
      //   initialize with first value in list
      for(j = 0; j < 5; j++) {
         sp->mean[j] = g->grids[j]->a[sp->indices[0]];
         sp->min[j] = g->grids[j]->a[sp->indices[0]];
         sp->max[j] = g->grids[j]->a[sp->indices[0]];
         //printf(" setting min to %f\n", sp->min[j]);
         //printf(" setting max to %f\n", sp->max[j]);
      }
      // then go through the rest
      for(i = 1; i < sp->count; i++) {
         for(j = 0; j < 5; j++) {
            sp->mean[j] += g->grids[j]->a[sp->indices[i]];
            if(g->grids[j]->a[sp->indices[i]] < sp->min[j]) {
               sp->min[j] = g->grids[j]->a[sp->indices[i]];
               //printf(" setting min to %f\n", sp->min[j]);
            }
            if(g->grids[j]->a[sp->indices[i]] > sp->max[j]) {
               sp->max[j] = g->grids[j]->a[sp->indices[i]];
               //printf(" setting max to %f\n", sp->max[j]);
            }
         }
         /*
         printf("mean: ");
         for(j = 0; j < 10; j++) {
            printf("%f\t", mean[j]);
         }
         printf("\n");
         printf("min: ");
         for(j = 0; j < 10; j++) {
            printf("%f\t", min[j]);
         }
         printf("\n");
         printf("max: ");
         for(j = 0; j < 10; j++) {
            printf("%f\t", max[j]);
         }
         printf("\n");
         */
      }
      /*
      printf("mean:\n");
      for(j = 0; j < 10; j++) {
         printf("%f\n", sp->mean[j]);
      }
      */
      for(j = 0; j < 5; j++) {
         sp->mean[j] = sp->mean[j] / sp->count;
      }
      /*
      printf("\n");
      for(j = 0; j < 10; j++) {
         printf("%f\t%f\t%f\n", sp->mean[j], sp->min[j], sp->max[j]);
      }
      */
      /*
      for(i = 0; i < sp->count; i++) {
         printf("%d\n", sp->indices[i]);
      }
      */
      // add species struct to list in global
      g->sp_list[n] = sp;
   }
}


int main(int argc, char **argv) {

   char *layers[5] = { "con_ci.asc", "con_dem.asc",
      "con_sloped.asc", "con_srad.asc", "con_tsi.asc"};

   int num_species;
   char *file_list;
   int num_threads, num_threads_tmp;
   int num_comps, pad;
   int i, j, count;
   global *g;
   IS is;
   unsigned char *ssi;
   time_t t1, t2;
   
   t_info *ti;
   pthread_t *threads;
   void *retval;

   if(argc != 4) {
      printf("usage: ssi num_species file_list num_threads\n");
      return 1;
   }
   sscanf(argv[1], "%d", &num_species);
   file_list = strdup(argv[2]);
   sscanf(argv[3], "%d", &num_threads);


   // set up global struct
   g = (global *)malloc(sizeof(global));
   g->sp_list = (species **)malloc(sizeof(species *) * num_species);
   g->file_list = (char **)malloc(sizeof(char *) * num_species);
   g->thresholds = (float *)malloc(sizeof(float) * num_species);
   g->num_species = num_species;
   g->mutex = (pthread_mutex_t *)malloc(sizeof(pthread_mutex_t));
   pthread_mutex_init(g->mutex, NULL);
   g->next_comp = 0;
   g->next_read = 0;

   // read in env layers
   g->grids = (grid **)malloc(sizeof(grid *) * 5);
   
   fprintf(stderr, "reading in env grids\n");
   for(i = 0; i < 5; i++) {
      g->grids[i] = read_file(layers[i]);
   }

   // read in filenames and threshold values from filelist
   is = new_inputstruct(file_list);
   for(i = 0; i < num_species; i++) {
      get_line(is);
      g->file_list[i] = strdup(is->fields[0]);
      sscanf(is->fields[1], "%f", g->thresholds + i);
   }
   jettison_inputstruct(is);

   // create thread arrays
   threads = (pthread_t *)malloc(sizeof(pthread_t) * num_threads);
   ti = (t_info *)malloc(sizeof(t_info) * num_threads);
   for(i = 0; i < num_threads; i++) {
      ti[i].id = i;
      ti[i].g = g;
      ti[i].num_read = 0;
   }

   //time(&t2);
   //printf("init done:\t\t%d (%d)\n", t2, t2-t1);

   /* reading in files */

   // limit number of threads for reading to 64
   num_threads_tmp = num_threads;
   if(num_threads > 64) num_threads = 64;

   if(num_threads > num_species) num_threads = num_species;

   fprintf(stderr, "spawning threads\n");
   // spawn threads to read in files
   for(i = 0; i < num_threads; i++) {
      pthread_create(threads+i, NULL, thread_read, &ti[i]);
   }

   for(i = 0; i < num_threads; i++) {
      pthread_join(threads[i], &retval);
   }

   for(i = 0; i < num_species; i++) {
      //printf("species %d\n", i);
      printf("'%s' => array (\n", g->sp_list[i]->name);
      for(j = 0; j < 5; j++) {
         if(j<4) printf("  array(%.2f, %.2f),\n", g->sp_list[i]->min[j],
               g->sp_list[i]->max[j]);
         else printf("  array(%.2f, %.2f)\n", g->sp_list[i]->min[j],
               g->sp_list[i]->max[j]);
      }
      printf("),\n");
   }

       
   free(ti);

   return 0;
}



