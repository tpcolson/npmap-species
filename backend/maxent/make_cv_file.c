#include<stdlib.h>
#include<stdio.h>
#include<string.h>

main (int argc, char *argv[]) {
   if (argc != 3) {
      printf("usage: make_cv_file ssi_matrix.dat size\n");
      exit(1);
   }
   FILE *rFile = fopen(argv[1], "rb");
   if (rFile == NULL) {
      perror(argv[1]);
      exit(1);
   }
   int threshold, size;
   if (sscanf(argv[2], "%d", &size) == 0 || size < 0) {
      printf("Error:: not a valid size\n");
      exit(1);
   }

   int i, j, k;
   unsigned char buffer[size * size];
   double ssi;
   fread(&buffer, sizeof(unsigned char), size*size, rFile);
   for (i = 0; i < size*size; i++) {
      printf("%d\n", buffer[i]);
   }
   fclose(rFile);
} //end main
