// grid struct for env layers
typedef struct {
   float *a;
   int ncols;
   int nrows;
} grid;

// species struct to hold presence counts
typedef struct {
   int *indices;     // list of indices from species grid where value > threshold
   float mean[5];
   float min[5];
   float max[5];
   int count;
   char *name;
} species;

// global struct to pass around to all threads
typedef struct {
   species **sp_list;         // list of species structs
   char **file_list;          // list of filenames for species
   float *thresholds;         // list of threshold values for each species
   unsigned char *ssi_list;
   int *comp_list;
   int num_species;
   int num_comps;
   pthread_mutex_t *mutex;
   int next_comp;
   int next_read;
   grid **grids;
} global;

// struct for each thread
typedef struct {
   int id;
   global *g;     // pointer to global struct
   int start;
   int end;
   time_t c1, c2;   // for timing
   int num_read;
} t_info;

void *thread_read(void *arg);
void *thread_ssi(void *arg);
void make_bov(unsigned char *ssi, int size);

