CC = gcc
#CC = icc
INCLUDE = -I libfdr/include
CFLAGS = -g $(INCLUDE)
LIBS = -lpthread -lm
PLANK_LIBS = -L libfdr/lib -lfdr
EXECUTABLES = asc2bov ssi summarize make_cv_file convert_matrix convert_coords

all: $(EXECUTABLES)

asc2bov: asc2bov.o
	$(CC) $(CFLAGS) -o $@ asc2bov.o $(PLANK_LIBS)

ssi: ssi.o
	$(CC) $(CFLAGS) -o $@ ssi.o $(LIBS) $(PLANK_LIBS)

summarize: summarize.o
	$(CC) $(CFLAGS) -lm -o $@ summarize.o 

make_cv_file: make_cv_file.o
	$(CC) $(CFLAGS) -o $@ make_cv_file.o 

convert_matrix: convert_matrix.o
	$(CC) $(CFLAGS) -o $@ convert_matrix.o $(PLANK_LIBS)

convert_coords: convert_coords.o
	$(CC) $(CFLAGS) -o $@ convert_coords.o $(PLANK_LIBS)

get_5env: get_5env.o
	$(CC) $(CFLAGS) -o $@ get_5env.o $(LIBS) $(PLANK_LIBS)

clean:
	rm -f core *.o $(EXECUTABLES)
