#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "fields.h"

#define NODATA_VALUE -9999

typedef struct Bov_Header{
	int dataSize[3];
	char dataFormat[256];
	char variable[256];
	char dataEndian[256];
	char centering[256];
	float brickOrigin[3];
	float brickSize[3];
} * BH;

BH read_bov(char *fname)
{
	BH bh;
	IS is;
	int i;
	
	is = new_inputstruct(fname);
	if(is == NULL){
		fprintf(stderr, "Unable to open %s\n", fname);
		exit(1);
	}
	bh = (BH) malloc(sizeof(struct Bov_Header));
	get_line(is); // DATA_FILE:
	get_line(is); // DATA_SIZE:
	for(i = 0; i < 3; i++)
		sscanf(is->fields[i+1], "%d", &bh->dataSize[i]);
	get_line(is); // DATA_FORMAT:
	sscanf(is->fields[1], "%s", &bh->dataFormat);
	get_line(is); // VARIABLE:
	sscanf(is->fields[1], "%s", &bh->variable);
	get_line(is); // DATA_ENDIAN:
	sscanf(is->fields[1], "%s", &bh->dataEndian);
	get_line(is); // CENTERING:
	sscanf(is->fields[1], "%s", &bh->centering);
	get_line(is); // BRICK_ORIGIN:
	for(i = 0; i < 3; i++)
		sscanf(is->fields[i+1], "%f", &bh->brickOrigin[i]);
	get_line(is); // BRICK_SIZE:
	for(i = 0; i < 3; i++)
		sscanf(is->fields[i+1], "%f", &bh->brickSize[i]);
	
	return bh;
}

void read_dat(char *fname, float *map, BH bh) {
   FILE *fp;

   fp = fopen(fname, "rb");
   if(fp == NULL) {
      fprintf(stderr, "unable to open %s\n", fname);
      exit(1);
   }

   fread(map, sizeof(float), bh->dataSize[0]*bh->dataSize[1], fp);
   fclose(fp);
}

void make_bov(float *map, char *fname, BH bh) {
   FILE *fp;
   char dat[256];
   char bov[256];
   int i;
   
   sprintf(dat, "%s.dat", fname);
   sprintf(bov, "%s.bov", fname);
   // write data to binary file
   fp = fopen(dat, "wb");
   fwrite(map, sizeof(float), bh->dataSize[0]*bh->dataSize[1], fp);
   fclose(fp);
   // write header file
   fp = fopen(bov, "w");
   fprintf(fp, "DATA_FILE: %s\n", dat);
   fprintf(fp, "DATA_SIZE: ");
   for(i = 0; i < 3; i++) fprintf(fp, "%d ", bh->dataSize[i]);
   fprintf(fp, "\n");
   fprintf(fp, "DATA_FORMAT: %s\n", bh->dataFormat);
   fprintf(fp, "VARIABLE: %s\n", bh->variable);
   fprintf(fp, "DATA_ENDIAN: %s\n", bh->dataEndian);
   fprintf(fp, "CENTERING: %s\n", bh->centering);
   fprintf(fp, "BRICK_ORIGIN: ");
   for(i = 0; i < 3; i++) fprintf(fp, "%f ", bh->brickOrigin[i]);
   fprintf(fp, "\n");
   fprintf(fp, "BRICK_SIZE: ");
   for(i = 0; i < 3; i++) fprintf(fp, "%f ", bh->brickSize[i]);
   fprintf(fp, "\n");
   fclose(fp);
}

int main(int argc, char **argv) {

   BH bh;
   char *rundir, *gs, fname[512];
   int i, j, total, nrows, ncols, numFolds;
   float **maps;
   float *avg, *stddev, *current;
   float mean, sumSqrs;     // sumSqrs = sum of squares
   float sd_mean, sd_max;

   if(argc != 3) {
       printf("usage: ./summarize Genus_species num_folds\n");
       exit(1);
    }
   // argv[1] is Genus_species 
   gs = strdup(argv[1]);
   sscanf(argv[2], "%d", &numFolds);
   
   // Read in one BOV header file
   sprintf(fname, "fold0/%s.bov", gs);
   bh = read_bov(fname);
   ncols = bh->dataSize[0];
   nrows = bh->dataSize[1];
   
   // Allocate memory
   maps = (float **)malloc(sizeof(float *)*numFolds);
   maps[0] = (float *)malloc(sizeof(float)*nrows*ncols*numFolds);
   for(i = 1; i < numFolds; i++) {
      maps[i] = maps[i-1] + (nrows*ncols);
   }
   avg = (float *)malloc(sizeof(float)*nrows*ncols);
   stddev = (float *)malloc(sizeof(float)*nrows*ncols);
   current = (float *)malloc(sizeof(float)*numFolds);

   // read in .dat files
   for(i = 0; i < numFolds; i++) {
      //sprintf(fname, "%s/fold%d/%s.asc", rundir, i, gs);
      sprintf(fname, "fold%d/%s.dat", i, gs);
      read_dat(fname, maps[i], bh);
   }

   // compute average map and stddev map
   sd_mean = 0.0;
   sd_max = 0.0;
   total = 0;
   for(i = 0; i < nrows*ncols; i++) {
      // skip this cell if NOVALUE (-9999)
      if(maps[0][i] == NODATA_VALUE) {
         avg[i] = maps[0][i];
         stddev[i] = maps[0][i];
         continue;
      }
      // get cell value from 10 maps
      for(j = 0; j < numFolds; j++) {
         current[j] = maps[j][i];
      }
      // first get average
      mean = 0.0;
      for(j = 0; j < numFolds; j++) {
         mean += current[j];
      }
      mean = mean / (float)numFolds;
      avg[i] = mean;
      // get sum of squared deviations
      sumSqrs = 0.0;
      for(j = 0; j < numFolds; j++) {
         sumSqrs += ((mean - current[j]) * (mean - current[j]));
      }
      stddev[i] = sqrtf(sumSqrs / (float)numFolds);

      // keep track of max and calculate average
      total++;
      if(stddev[i] > sd_max) sd_max = stddev[i];
      sd_mean += stddev[i];
      /*
      for(j = 0; j < 10; j++) {
         printf("current[%d] = %f\n", j, current[j]);
      }
      printf("mean: %f  sumSqrs: %f  stddev: %f\n", mean, sumSqrs, stddev);
      */
      //exit(1);

   }
   sd_mean = sd_mean / total;

   printf("%s %f %f\n", gs, sd_mean, sd_max);

   sprintf(fname, "%s_avg", gs);
   make_bov(avg, fname, bh);
   sprintf(fname, "%s_std", gs);
   make_bov(stddev, fname, bh);

      
   /*
   for(i = 0; i < 10; i++) {
      for(j = 0; j < 20; j++) {
         printf("%d,%d: %f\n", i, j, maps[i][j]);
      }
   }
   */
   free(avg);
   free(stddev);
   free(current);
   free(maps[0]);
   free(maps);
}

