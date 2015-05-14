/***
 *
 * clustering.h
 * Author: John Duggan
 * Last update: August 2, 2014
 *
 * Header file for my useless clustering library
 *
 * Questions can go to jduggan1@vols.utk.edu
 *
***/

#ifndef _CLUSTERING_H_
#define _CLUSTERING_H_

#include <stdio.h>

typedef struct cluster_node {
	int points;
	int level;
	int num_children;
	int group;
	int *list;
	char *name;
	struct cluster_node *parent;
	struct cluster_node **children;
} * C;

typedef enum {
	CL_SINGLE,
	CL_AVERAGE,
	CL_COMPLETE
} linkage_type;

#ifdef __cplusplus
extern "C"
{
#endif

	C build_cluster_tree(float *sim_matrix, int matrix_length, char **names, int compress_paths, int max_depth, linkage_type l_type);
	void cluster_tree_to_json(FILE *f, C root);
	void delete_cluster_tree(C node);

#ifdef __cplusplus
}
#endif

#endif
