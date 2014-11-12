/*  asc2bov.c
    Reads in ascii SDM from MaxEnt and converts it to BOV format.
    (Plank's Fields library had to be modified to handle larger number of 
    fields.)
*/

#include<stdio.h>
#include<stdlib.h>
#include"fields.h"

#define X_ORIGIN -84.008945360047
#define Y_ORIGIN 35.418749944996
#define CELL_SIZE 0.000309164334

typedef struct {
   float *a;
   int ncols;
   int nrows;
   float xOrigin;
   float yOrigin;
   float cellsize;
} grid;

grid *read_file(char *filename) {

    int i, j, n;
    int ncols, nrows, total;
	float xOrigin, yOrigin, cellsize;
    grid *g;
    IS is;

    is = new_inputstruct(filename);
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
	if(get_line(is) < 0) {
       fprintf(stderr, "problem reading %s\n", filename);
       exit(1);
    }
	sscanf(is->fields[1], "%f", &xOrigin);
	if(get_line(is) < 0) {
       fprintf(stderr, "problem reading %s\n", filename);
       exit(1);
    }
	sscanf(is->fields[1], "%f", &yOrigin);
	if(get_line(is) < 0) {
       fprintf(stderr, "problem reading %s\n", filename);
       exit(1);
    }
	sscanf(is->fields[1], "%f", &cellsize);
	
    g = (grid *)malloc(sizeof(grid));
    g->a = (float *)malloc(sizeof(float) * ncols * nrows);
    g->ncols = ncols;
    g->nrows = nrows;
	g->xOrigin = xOrigin;
	g->yOrigin = yOrigin;
	g->cellsize = cellsize;
	
    total = 0;
    for(i = 0; i < nrows; i++) {
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
void make_bov(grid *g, char *species) {
   FILE *fp;
   char dat[256];
   char bov[256];
   sprintf(dat, "%s.dat", species);
   sprintf(bov, "%s.bov", species);
   // write data to binary file
   fp = fopen(dat, "wb");
   fwrite((void *)g->a, sizeof(float), g->ncols * g->nrows, fp);
   fclose(fp);
   // write header file
   fp = fopen(bov, "w");
   fprintf(fp, "DATA_FILE: %s\n", dat);
   fprintf(fp, "DATA_SIZE: %d %d 1\n", g->ncols, g->nrows);
   fprintf(fp, "DATA_FORMAT: FLOAT\n");
   fprintf(fp, "VARIABLE: presence\n");
   fprintf(fp, "DATA_ENDIAN: LITTLE\n");
   fprintf(fp, "CENTERING: zonal\n");
   fprintf(fp, "BRICK_ORIGIN: %f %f 0\n", g->xOrigin, g->yOrigin);
   fprintf(fp, "BRICK_SIZE: %f %f 1\n", g->ncols*g->cellsize, g->nrows*g->cellsize);
   fclose(fp);
}


int main(int argc, char **argv) {

    char *file, *species;  
    grid *g;

    if(argc != 3) {
       printf("usage: asc2bov ascii_filename species_name\n");
       return 1;
    }
    file = strdup(argv[1]);
    species = strdup(argv[2]);

    g = read_file(file);

    make_bov(g, species);
	
    return 0;
}
