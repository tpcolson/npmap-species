#include<stdio.h>
#include<stdlib.h>
#include<math.h>

#define ROWS 1302
#define COLS 2899

void readfile(char *fname, float *map) {
   FILE *fp;
   int i, j;

   fp = fopen(fname, "rb");
   if(fp == NULL) {
      fprintf(stderr, "unable to open %s\n", fname);
      exit(1);
   }

   fread(map, sizeof(float), ROWS*COLS, fp);
   fclose(fp);
}

void make_bov(float *map, char *species) {
   FILE *fp;
   char dat[256];
   char bov[256];
   sprintf(dat, "%s.dat", species);
   sprintf(bov, "%s.bov", species);
   // write data to binary file
   fp = fopen(dat, "wb");
   fwrite(map, sizeof(float), ROWS*COLS, fp);
   fclose(fp);
   // write header file
   fp = fopen(bov, "w");
   fprintf(fp, "DATA_FILE: %s\n", dat);
   fprintf(fp, "DATA_SIZE: %d %d 1\n", COLS, ROWS);
   fprintf(fp, "DATA_FORMAT: FLOAT\n");
   fprintf(fp, "VARIABLE: presence\n");
   fprintf(fp, "DATA_ENDIAN: LITTLE\n");
   fprintf(fp, "CENTERING: zonal\n");
   fprintf(fp, "BRICK_ORIGIN: 228093.609769 3923599.272669 0\n");
   fprintf(fp, "BRICK_SIZE: %d %d 1\n", COLS*30, ROWS*30);
   fclose(fp);
}

int main(int argc, char **argv) {

   char *rundir, *gs;
   char fname[512];
   int i,j,total;
   int nf;          // number of folds
   float **maps;
   float *avg, *stddev, *current;
   float mean, sos;     // sos = sum of squares
   float sd_mean, sd_max;

   if(argc != 3) {
       printf("usage: ./summarize Genus_species num_folds\n");
       exit(1);
    }
   // argv[1] is Genus_species 
   gs = strdup(argv[1]);
   sscanf(argv[2], "%d", &nf);

   maps = (float **)malloc(sizeof(float *)*nf);
   maps[0] = (float *)malloc(sizeof(float)*ROWS*COLS*nf);
   for(i = 1; i < nf; i++) {
      maps[i] = maps[i-1] + (ROWS*COLS);
   }
   avg = (float *)malloc(sizeof(float)*ROWS*COLS);
   stddev = (float *)malloc(sizeof(float)*ROWS*COLS);
   current = (float *)malloc(sizeof(float)*nf);

   // read in .dat files
   for(i = 0; i < nf; i++) {
      //sprintf(fname, "%s/fold%d/%s.asc", rundir, i, gs);
      sprintf(fname, "fold%d/%s.dat", i, gs);
      readfile(fname, maps[i]);
   }

   // compute average map and stddev map
   sd_mean = 0.0;
   sd_max = 0.0;
   total = 0;
   for(i = 0; i < ROWS*COLS; i++) {
   //for(i = 300000; i < 330000; i++) {
      // skip this cell if NOVALUE (-9999)
      if(maps[0][i] < 0) {
         avg[i] = maps[0][i];
         stddev[i] = maps[0][i];
         continue;
      }
      // get cell value from 10 maps
      for(j = 0; j < nf; j++) {
         current[j] = maps[j][i];
      }
      // first get average
      mean = 0.0;
      for(j = 0; j < nf; j++) {
         mean += current[j];
      }
      mean = mean / (float)nf;
      avg[i] = mean;
      // get sum of squared deviations
      sos = 0.0;
      for(j = 0; j < nf; j++) {
         sos += ((mean - current[j]) * (mean - current[j]));
      }
      stddev[i] = sqrtf(sos / (float)nf);

      // keep track of max and calculate average
      total++;
      if(stddev[i] > sd_max) sd_max = stddev[i];
      sd_mean += stddev[i];
      /*
      for(j = 0; j < 10; j++) {
         printf("current[%d] = %f\n", j, current[j]);
      }
      printf("mean: %f  sos: %f  stddev: %f\n", mean, sos, stddev);
      */
      //exit(1);

   }
   sd_mean = sd_mean / total;

   printf("%s %f %f\n", gs, sd_mean, sd_max);

   make_bov(avg, "avg");
   make_bov(stddev, "stddev");

      
   /*
   for(i = 0; i < 10; i++) {
      for(j = 0; j < 20; j++) {
         printf("%d,%d: %f\n", i, j, maps[i][j]);
      }
   }
   */
   free(avg);
   free(stddev);
   free(maps[0]);
   free(maps);
}

