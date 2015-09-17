/*---------------------------------------------
	ssi_bov2asc.c
	Converts filename.bov to asc format and prints to stdout.
	Usage example: ssi_bov2asc filename > filename.asc
	for ssi similarity matrix only

---------------------------------------------------*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "libfdr/fields.h"

typedef struct grid
{
	unsigned char *data;
	int ncols;
	int nrows;
} * GRID;

GRID
read_file(char *filename)
{
	GRID g;
	int ncols, nrows;
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
	jettison_inputstruct(is);

	// fill out the grid header
	g = (GRID) malloc(sizeof(struct grid));
	g->data = (unsigned char *) malloc(sizeof(unsigned char) * ncols * nrows);
	g->ncols = ncols;
	g->nrows = nrows;

	// read data
	fp = fopen(datfile, "rb");
	if(fp == NULL) {
		fprintf(stderr, "unable to open %s\n", filename);
		exit(1);
	}
	fread(g->data, sizeof(unsigned char), ncols*nrows, fp);
	fclose(fp);

	return g;
}

void
make_asc(GRID g)
{
	// write header
	printf("%-14s%d\n", "ncols", g->ncols);
	printf("%-14s%d\n", "nrows", g->nrows);

	// write data
	int i, j, index;
	for(i = 0; i < g->ncols; i++) {
		for(j = 0; j < g->nrows; j++) {
			index = i * g->nrows + j;
			printf("%d ", (int) g->data[index]);
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
		fprintf(stderr, "usage: ssi_bov2asc filename\n");
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
