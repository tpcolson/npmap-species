CC = gcc
INCLUDE = -I/nics/a/home/simmerma/plank_libfdr/include
CFLAGS = -g $(INCLUDE)
LIBS = -lpthread
PLANK_LIBS = -L/nics/a/home/simmerma/plank_libfdr/lib -lfdr

make_folds: make_folds.o
	$(CC) $(CFLAGS) -o $@ make_folds.o $(PLANK_LIBS)

