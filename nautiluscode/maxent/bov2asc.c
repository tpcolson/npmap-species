#include<stdio.h>
#include<stdlib.h>
#include"fields.h

typedef struct {
   int *a;
   int ncols;
   int nrows;
} grid;

grid *read_file(char *filename) {

    int ncols, nrows;
    grid *g;
    char bovfile[256], datfile[256];
    IS is;
    FILE *fp;

    sprintf(bovfile, "%s.bov", filename);
    sprintf(datfile, "%s.dat", filename);

    // get cols and rows from bov file
    is = new_inputstruct(bovfile);
    get_line(is);
    get_line(is);
    sscanf(is->fields[1], "%d", &ncols);
    sscanf(is->fields[2], "%d", &nrows);
    jettison_inputstruct(is);

    g = (grid *)malloc(sizeof(grid));
    g->a = (int *)malloc(sizeof(int) * ncols * nrows);
    g->ncols = ncols;
    g->nrows = nrows;

    fp = fopen(datfile, "rb");
    if(fp == NULL) {
       fprintf(stderr, "unable to open %s\n", filename);
       exit(1);
    }
    fread(g->a, sizeof(int), ncols*nrows, fp);
    fclose(fp);


    return g;
}
/*
void make_bov(grid *g, char *species) {
   FILE *fp;
   char dat[256];
   char bov[256];
   sprintf(dat, "%s.dat", species);
   sprintf(bov, "%s.bov", species);
   // write data to binary file
   fp = fopen(dat, "wb");
   fwrite((void *)g->a, sizeof(int), g->ncols * g->nrows, fp);
   fclose(fp);
   // write header file
   fp = fopen(bov, "w");
   fprintf(fp, "DATA_FILE: %s\n", dat);
   fprintf(fp, "DATA_SIZE: %d %d 1\n", g->ncols, g->nrows);
   fprintf(fp, "DATA_FORMAT: INT\n");
   fprintf(fp, "VARIABLE: presence\n");
   fprintf(fp, "DATA_ENDIAN: LITTLE\n");
   fprintf(fp, "CENTERING: zonal\n");
   fprintf(fp, "BRICK_ORIGIN: 0 0 0\n");
   fprintf(fp, "BRICK_SIZE: %d %d 1\n", g->ncols, g->nrows);
   fclose(fp);
}
*/


int main(int argc, char **argv) {

    int i,j,count;
    char *file, *species;  
    grid *g;

    if(argc != 2) {
       printf("usage: bov2asc input\n");
       return 1;
    }
    file = strdup(argv[1]);
    //species = strdup(argv[2]);

    g = read_file(file);

    for(i=0;i<g->nrows;i++) {
        for(j=0;j<g->ncols;j++) {
            printf("%d ", g->a[i*g->ncols+j]);
        }
        printf("\n");
    }

    //make_bov(g, species);

    return 0;
}
