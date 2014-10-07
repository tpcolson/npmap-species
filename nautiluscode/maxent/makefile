CC = gcc
#CC = icc
INCLUDE = -I libfdr/include
CFLAGS = -g $(INCLUDE)
LIBS = -lpthread -lm
PLANK_LIBS = -L libfdr/lib -lfdr
EXECUTABLES = asc2bov ssi summarize make_folds

all: $(EXECUTABLES)

asc2bov: asc2bov.o
	$(CC) $(CFLAGS) -o $@ asc2bov.o $(PLANK_LIBS)

bov2asc: bov2asc.o
	$(CC) $(CFLAGS) -o $@ bov2asc.o $(PLANK_LIBS)

ssi: ssi.o
	$(CC) $(CFLAGS) -o $@ ssi.o $(LIBS) $(PLANK_LIBS)

summarize: summarize.o
	$(CC) $(CFLAGS) -lm -o $@ summarize.o 

make_folds: make_folds.o
	$(CC) $(CFLAGS) -o $@ make_folds.o $(PLANK_LIBS)

.c.o: *.c
	$(CC) -c $@ *.o

clean:
	rm -f core *.o $(EXECUTABLES)
