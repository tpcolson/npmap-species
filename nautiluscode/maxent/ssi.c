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
#include"ssi.h"
#include<fcntl.h>

#define CHUNK 1

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

   /* THESE DIMENSIONS HAVE CHANGED SLIGHTLY, 1302 TO 1303 */
   ncols=2899;
   nrows=1302;
   //nrows=1303;
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
            sp->indices[total] = i;
            total++;
         }
      }
      close(fp);
      sp->count = total;

      // add species struct to list in global
      g->sp_list[n] = sp;
   }
}
void *thread_ssi(void *arg) {

   t_info *ti;
   ti = (t_info *)arg;
   global *g;
   g = (global *)ti->g;
   int n, start;
   int matches, i1, i2, comp;
   int comps;
   float ssi;
   unsigned char ssi_char;
   species *sp_a, *sp_b;
   int sp_ai, sp_bi;

   ti->num_read = 0;
   //time(&ti->c1);
   while(1) {
      // obtain lock
      if(pthread_mutex_lock(g->mutex) != 0) {
         perror("pthread_mutex_lock"); exit(1);
      }
      // get next starting index
      start = g->next_comp;
      // if done, clean up and exit
      if(start == g->num_comps) {
         pthread_mutex_unlock(g->mutex);
         //time(&ti->c2);
         pthread_exit(NULL);
      }
      else g->next_comp += CHUNK;

      // release lock
      pthread_mutex_unlock(g->mutex);
      
      ti->num_read++;
      // do comparisons
      for(n = start; n < start+CHUNK; n++) {
         comp = g->comp_list[n];
         matches = 0;
         i1 = 0;
         i2 = 0;
         sp_a = g->sp_list[comp / g->num_species];
         sp_b = g->sp_list[comp % g->num_species];
         sp_ai = comp/g->num_species;
         sp_bi = comp % g->num_species;
         while(i1 < sp_a->count && i2 < sp_b->count) {
            if(sp_a->indices[i1] == sp_b->indices[i2]) {
               matches++;
               i1++;
               i2++;
            }
            else if(sp_a->indices[i1] < sp_b->indices[i2]) {
               i1++;
            }
            else {
               i2++;
            }
         }
         // calculate sorensen similarity index (ssi)
         if(sp_a->count == 0 || sp_b->count == 0) {
            ssi = 0.0;
         }
         else {
            ssi = 2.0 * (float)matches / (float)(sp_a->count + sp_b->count);
         }
         if(ssi == 1.0) ssi_char = 255;
         else ssi_char = (unsigned char)(ssi * 255.0);
         g->ssi_list[n] = ssi_char;

      }
   }
}
void make_bov(unsigned char *ssi, int size) {
   int i, j, x, y;
   FILE *fp;
   // write data to binary file
   fp = fopen("matrix.dat", "wb");
   fwrite((void *)ssi, sizeof(unsigned char), size*size, fp);
   fclose(fp);
   // write header file
   fp = fopen("matrix.bov", "w");
   fprintf(fp, "DATA_FILE: matrix.dat\n");
   fprintf(fp, "DATA_SIZE: %d %d 1\n", size, size);
   fprintf(fp, "DATA_FORMAT: BYTE\n");
   fprintf(fp, "VARIABLE: ssi\n");
   fprintf(fp, "DATA_ENDIAN: LITTLE\n");
   fprintf(fp, "CENTERING: zonal\n");
   fprintf(fp, "BRICK_ORIGIN: 0 0 0\n");
   fprintf(fp, "BRICK_SIZE: %d %d 1\n", size, size);
   fclose(fp);
}


int main(int argc, char **argv) {

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

   //time(&t1);
   //printf("    start:\t\t%d\n", t1);
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

   // spawn threads to read in files
   //time(&t1);
   //printf(" spawning:\t\t%d (%d)\n", t1, t1-t2);
   for(i = 0; i < num_threads; i++) {
      pthread_create(threads+i, NULL, thread_read, &ti[i]);
   }

   //time(&t2);
   //printf("  joining:\t\t%d (%d)\n", t2, t2-t1);
   for(i = 0; i < num_threads; i++) {
      pthread_join(threads[i], &retval);
   }
   //time(&t1);
   //printf("   joined:\t\t%d (%d)\n", t1, t1-t2);
   // print out some stats
   /*
   for(i = 0; i < num_threads; i++) {
      printf("%d %d %d\n", i, ti[i].num_read, 
            (int)ti[i].c2 - ti[i].c1);
   }
   */

   /* grid comparisons */

   num_threads = num_threads_tmp;

   num_comps = (num_species * num_species - num_species) / 2;
   
   // removing pad since CHUNK will always be 1
   //pad = CHUNK - (num_comps%CHUNK);
   //g->num_comps = num_comps+pad;
   g->num_comps = num_comps;

   /* the comp_list will contain only the pair-wise comparisons that need to be
      made, with no redundancy; for example with 4 species:

               A  B  C  D
            A  0  1  2  3
            B  4  5  6  7
            C  8  9  10 11
            D  12 13 14 15

      the only comps that need to be done are AB(1), AC(2), AD(3), BC(6),
      BD(7) and CD(11) to cover all possible pairings; so the comp_list would 
      include just the indices 1,2,3,6,7,11
   */
   //g->comp_list = (int *)malloc(sizeof(int) * (num_comps+pad));
   g->comp_list = (int *)malloc(sizeof(int) * (num_comps));
   //g->ssi_list = (unsigned char *)malloc(sizeof(unsigned char) * (num_comps+pad));
   g->ssi_list = (unsigned char *)malloc(sizeof(unsigned char) * (num_comps));

   // get indices for pair-wise comparisons
   count = 0;
   for(i = 0; i < (num_species - 1); i++) {
      for(j = i + 1; j < num_species; j++) {
         g->comp_list[count] = i * num_species + j;
         count++;
      }
   }
   // wrap around beginning to fill in pad
   /*
   j = 0;
   for(i = count; i < (num_comps+pad); i++) {
      g->comp_list[i] = g->comp_list[j];
      j++;
   }
   */

   //time(&t2);
   //printf(" spawning:\t\t%d (%d)\n", t2, t2-t1);
   for(i = 0; i < num_threads; i++) {
      pthread_create(threads+i, NULL, thread_ssi, &ti[i]);
   }

   //time(&t1);
   //printf("  joining:\t\t%d (%d)\n", t1, t1-t2);
   for(i = 0; i < num_threads; i++) {
      pthread_join(threads[i], &retval);
   }
   //time(&t2);
   //printf("   joined:\t\t%d (%d)\n", t2, t2-t1);

   // print out some stats
   /*
   for(i = 0; i < num_threads; i++) {
      printf("%d %d %d\n", i, ti[i].num_read, 
            (int)ti[i].c2 - ti[i].c1);
   }
   */
       
   free(ti);

   // make ssi matrix
   ssi = (unsigned char *)malloc(sizeof(unsigned char) * num_species * num_species);
   // put '1's (255) on the diagonal
   for(i = 0; i < num_species; i++) ssi[i*num_species+i] = 255;
   //fill in upper triangle and lower triangle from ssi values
   count = 0;
   for(i = 0; i < (num_species - 1); i++) {
      for(j = i + 1; j < num_species; j++) {
         ssi[i*num_species+j] = g->ssi_list[count];
         ssi[j*num_species+i] = g->ssi_list[count];
         count++;
      }
   }

   // write out matrix in bov format
   make_bov(ssi, num_species);


   return 0;
}
