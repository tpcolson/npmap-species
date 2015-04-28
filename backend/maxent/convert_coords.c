#include<stdio.h>
#include<stdlib.h>
#include"fields.h"

int main(int argc, char **argv) {
   int size, i, j;
   float xmin, ymin, xmax, ymax, xspan, yspan;
   IS is;
   char **species;
   float *x, *y;

   sscanf(argv[2], "%d", &size);

   species = (char **)malloc(sizeof(char *) * size);
   x = (float *)malloc(sizeof(float) * size);
   y = (float *)malloc(sizeof(float) * size);

   // read file and keep track of min and max for x and y
   is = new_inputstruct(argv[1]);

   for(i = 0; i < size; i++) {
      get_line(is);
      species[i] = strdup(is->fields[0]);
      sscanf(is->fields[1], "%f", x+i);
      sscanf(is->fields[2], "%f", y+i);
      if(i == 0) {
         xmin = xmax = x[i];
         ymin = ymax = y[i];
      }
      else {
         if(x[i] < xmin) xmin = x[i];
         if(x[i] > xmax) xmax = x[i];
         if(y[i] < ymin) ymin = y[i];
         if(y[i] > ymax) ymax = y[i];
      }
   }

   jettison_inputstruct(is);

   //printf("x range: %f to %f\n", xmin, xmax);
   //printf("y range: %f to %f\n", ymin, ymax);

   // add a little buffer
   //   (changed from 0.1 to 0.01)
   xmin -= 0.01;
   xmax += 0.01;
   ymin -= 0.01;
   ymax += 0.01;

   xspan = xmax - xmin;
   yspan = ymax - ymin;

   // output normalized coordinates
   for(i = 0; i < size; i++) {
      printf("%s %f %f\n", species[i], (x[i] - xmin)/xspan, 
            1.0 - ((y[i] - ymin)/yspan));
   }

}
