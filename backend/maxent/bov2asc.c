/*---------------------------------------------
	bov2asc.c
	Converts filename.bov to asc format and prints to stdout.
	Usage example: bov2asc filename > filename.asc

---------------------------------------------------*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "fields.h"

#define NODATA_VALUE -9999.0

typedef struct grid
{
	float *data;
	int ncols;
	int nrows;
	float xllcorner;
	float yllcorner;
	float cellsize;
} * GRID;

GRID
read_file(char *filename)
{
	int ncols, nrows;
	float xllcorner, yllcorner, bricksizeY;
	GRID g;
	char bovfile[256], datfile[256];
	IS is;
	FILE *fp;

	sprintf(bovfile, "%s.bov", filename);
	sprintf(datfile, "%s.dat", filename);

	// get cols and rows from bov file
	is = new_inputstruct(bovfile);
	get_line(is);
	get_line(is); // 2nd line
	sscanf(is->fields[1], "%d", &ncols);
	sscanf(is->fields[2], "%d", &nrows);
	get_line(is);
	get_line(is);
	get_line(is);
	get_line(is);
	get_line(is); // 7th line
	sscanf(is->fields[1], "%f", &xllcorner);
	sscanf(is->fields[2], "%f", &yllcorner);
	get_line(is);
	sscanf((is->fields[1]), "%f", &bricksizeY);
	jettison_inputstruct(is);

	// fill out the grid header
	g = (GRID) malloc(sizeof(struct grid));
	g->data = (float *) malloc(sizeof(float) * ncols * nrows);
	g->ncols = ncols;
	g->nrows = nrows;
	g->xllcorner = xllcorner;
	g->yllcorner = yllcorner;
	g->cellsize = bricksizeY/ncols;

	// read data
	fp = fopen(datfile, "rb");
	if(fp == NULL) {
		fprintf(stderr, "unable to open %s\n", filename);
		exit(1);
	}
	fread(g->data, sizeof(float), ncols*nrows, fp);
	fclose(fp);

	return g;
}

void
make_asc(GRID g)
{
	// write header
	printf("%-14s%d\n", "ncols", g->ncols);
	printf("%-14s%d\n", "nrows", g->nrows);
	printf("%-14s%f\n", "xllcorner", g->xllcorner);
	printf("%-14s%f\n", "yllcorner", g->yllcorner);
	printf("%-14s%f\n", "cellsize", g->cellsize);
	printf("%-14s%f\n", "NODATA_value", NODATA_VALUE);

	// write data
	int i, j, index;
	for(i = 0; i < g->nrows; i++) {
		for(j = 0; j < g->ncols; j++) {
			index = i * g->ncols + j;
			printf("%f ", g->data[index]);
		}
		printf("\n");
	}
}

int
main(int argc, char **argv)
{
	char *fname;
	GRID g;

	// parse arguments
	if(argc != 2) {
		fprintf(stderr, "usage: bov2asc filename\n");
		return 1;
	}
	fname = strdup(argv[1]);

	// read and convert file
	g = read_file(fname);
	make_asc(g);

	free(fname);
	free(g);
	return 0;
}
