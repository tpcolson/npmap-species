#include<stdlib.h>
#include<stdio.h>
#include<string.h>
#include"fields.h"

/**************************************************************
   convert_matrix.c

   reads in matrix.dat given as cmd line arg
   reads species from stdin; for each species, writes corresponding row from
      matrix into separate file in for_web/ssi_rows
   also writes (to stdout) a csv file of whole matrix with header (for use in R)

   use example (for 124 species):
   ls maxent_results | ./convert_matrix matrix.dat 124 > matrix.csv
***************************************************************/

main (int argc, char *argv[]) {
   int i, j, k, start, size;
   unsigned char *buffer;
   char row_file[512];
   double ssi;
   FILE *fp, *matrix;
   IS is;

   if (argc != 3) {
      printf("usage: bov2csv ssi_matrix.dat size\n");
      exit(1);
   }
   matrix = fopen(argv[1], "rb");
   if (matrix == NULL) {
      perror(argv[1]);
      exit(1);
   }
   if (sscanf(argv[2], "%d", &size) == 0 || size < 0) {
      printf("Error:: not a valid size\n");
      exit(1);
   }

   buffer = (unsigned char *)malloc(sizeof(unsigned char) * size * size);
   // read matrix into buffer
   fread(buffer, sizeof(unsigned char), size*size, matrix);
   fclose(matrix);

   // read species from stdin
   //  for each one, make separate file with appropriate row out of matrix
   i = 0;
   is = new_inputstruct(NULL);
   while(get_line(is) >= 0) {
      sprintf(row_file, "for_web/ssi_rows/%s.txt", is->fields[0]);
      fp = fopen(row_file, "w");
      start = i * size;
      for(j = 0; j < size; j++) {
         fprintf(fp, "%d\n", buffer[start+j]);
      }
      
      //printf("field 0 is %s\n", is->fields[0]);
      fclose(fp);

      // print out header line incrementally
      if(i == 0) {
         printf("%s", is->fields[0]);
      }
      else printf(",%s", is->fields[0]);

      i++;
   }
   printf("\n");
   jettison_inputstruct(is);

   // write out csv file of whole matrix
   for (i = 0; i < size; i++) {
      for (j = 0; j < size; j++) {
         k = buffer[i*size+j];
         k = 255 - k;
         // ADDING THIS TO TAKE CARE OF ZEROS
         if(k == 0 && i != j) k = 1;
         //if(k==0) ssi = 0.001;
         //else ssi = (double)255.0/k;
         //else ssi = k / (double)255.0;
         ssi = k / (double)255.0;
         if(j==0) {
            printf("%lf",ssi);
         }
         else printf(",%lf",ssi);
      } //end reading each field per line
      printf("\n");
   } //end checking rows
   free(buffer);
} //end main
