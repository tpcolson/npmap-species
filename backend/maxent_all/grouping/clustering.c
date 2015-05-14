/***
 *
 * clustering.c
 * Author: John Duggan
 * Last update: August 2, 2014
 *
 * Source code for my useless clustering library
 *
 * Questions can go to jduggan1@vols.utk.edu
 *
***/

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "clustering.h"

#define minimum(x, y) ((x) < (y) ? (x) : (y))
#define maximum(x, y) ((x) < (y) ? (y) : (x))

C initialize_tree(int length, char **names);
int get_max_sim_index(float *sim_matrix, int length);
void merge_clusters(C root, int left, int right, int compress_paths);
void reduce_sim_matrix(float *old_matrix, float *new_matrix, int old_length, int left, int right, linkage_type l_type);
void increment_tree_levels(C node);
void decrement_tree_levels(C node);
void reduce_tree_depth(C root, int max_depth);
void set_group_numbers(C root);
int group_numbering_helper(C node, int group_number);

/***
 * This function takes a similarity matrix and transforms it into a hierarchical cluster tree.  If compress_paths is TRUE,
 * then the cluster tree will have a maximum depth of max_depth. A pointer to the root of the cluster tree is returned.
***/
C
build_cluster_tree(float *similarity_matrix, int length, char **names, int compress_paths, int max_depth, linkage_type l_type) {
	C root = initialize_tree(length, names);

	//this matrix is used for reducing the size of the similarity matrix as clusters are merged
	float *new_similarity_matrix = (float *) malloc(length*length*sizeof(float));

	int similarity_matrix_length = length;
	int index;
	while(1) {
		//find the index in the sim matrix of the most similar clusters
		int max_sim_index = get_max_sim_index(similarity_matrix, similarity_matrix_length);

		//determine the two clusters which correspond to that index
		int run_left = max_sim_index / similarity_matrix_length;
		int run_right = max_sim_index % similarity_matrix_length;

		//to make later processing easier, the runs are sorted such that run_left < run_right
		if(run_left > run_right) {
			int temp = run_left;
			run_left = run_right;
			run_right = temp;
		}

		//merge the two clusters identified as the most similar
		merge_clusters(root, run_left, run_right, compress_paths);

		//if the root only has two children, then the full cluster tree has been build and we are done
		if(root->num_children == 2) break;

		//merge the two rows and columns representing the now merged clusters of the sim matrix
		reduce_sim_matrix(similarity_matrix, new_similarity_matrix, similarity_matrix_length, run_left, run_right, l_type);
		similarity_matrix = new_similarity_matrix;
		similarity_matrix_length--;
	}

	if(compress_paths) reduce_tree_depth(root, max_depth);

	free(new_similarity_matrix);

	set_group_numbers(root);

	return root;
}

/***
 * This function takes a cluster tree and writes it to a .json file specified by f for easy
 * visualization of the cluster tree.
***/
void
cluster_tree_to_json(FILE *f, C root) {
	C node = root;

	fprintf(f, "{");
	fprintf(f, "\"name\":\"%s\",", node->name);
	if(node->points == 1) {
		fprintf(f, "\"size\":0,");

		char group[1000];
		snprintf(group, 1000, "\"group\":%d", node->group);
		fprintf(f, "%s", group);
	} else {
		fprintf(f, "\"size\":-1,");
		fprintf(f, "\"group\":-1,");

		//write children to file recursively
		fprintf(f, "\"children\":[");
		int i;
		for(i = 0; i < node->num_children-1; i++) {
			cluster_tree_to_json(f, node->children[i]);
			fprintf(f, ",");
		}
		cluster_tree_to_json(f, node->children[node->num_children-1]);
		fprintf(f, "]");
	}
	fprintf(f, "}");
}

/***
 * Rather self-explanatory, deletes a cluster tree.
***/
void
delete_cluster_tree(C node) {
	free(node->name);
	free(node->list);
	if(node->children != NULL) {
		int i;
		for(i = 0; i < node->num_children; i++) delete_cluster_tree(node->children[i]);
		free(node->children);
	}
	free(node);
}

/***
 * This function builds an initial cluster tree with a root node connected to each leaf cluster,
 * which will then be merged together later. The return value is a pointer to the root of the
 * newly created cluster tree.
***/
C
initialize_tree(int length, char **names) {
	//create root cluster
	C root;
	root = (C) malloc(sizeof(struct cluster_node));
	root->name = (char *) malloc(1000*sizeof(char));
	strncpy(root->name, strdup("root"), 1000);
	root->points = length;
	root->list = (int *) malloc(root->points*sizeof(int));
	int i;
	for(i = 0; i < length; i++) root->list[i] = i;
	root->level = 0;
	root->parent = NULL;
	root->num_children = root->points;
	root->group = -1;
	root->children = (C *) malloc(length*sizeof(C));

	//create initial child clusters
	for(i = 0; i < length; i++) {
		C cluster = (C) malloc(sizeof(struct cluster_node));
		cluster->name = (char *) malloc(1000*sizeof(char));
		strncpy(cluster->name, names[i], 1000);
		cluster->points = 1;
		cluster->list = (int *) malloc(cluster->points*sizeof(int));
		cluster->list[cluster->points-1] = i;
		cluster->level = 1;
		cluster->parent = root;
		cluster->num_children = 0;
		cluster->children = NULL;
		root->children[i] = cluster;
	}

	return root;
}

/***
 * This function searches through a similarity_matrix and returns the index corresponding to the
 * greatest similarity in that matrix (ignoring the similarity of one cluster to itself).
***/
int
get_max_sim_index(float *similarity_matrix, int length) {
	int max_sim = -1;
	int max_sim_index = 0;
	int i, j, index;
	for(i = 0; i < length; i++) {
		for(j = 0; j < length; j++) {
			index = i*length + j;
			if(i != j && max_sim < similarity_matrix[index]) {
				max_sim_index = index;
				max_sim = similarity_matrix[index];
			}
		}
	}

	return max_sim_index;
}

/***
 * This function takes two clusters in the cluster tree specified by root, and merges them into
 * a single cluster which becomes part of the tree. This merging uses path compression if
 * compress_paths is set to true.  No return value, the updated tree is stored in root.
***/
void
merge_clusters(C root, int run_left, int run_right, int compress_paths) {
	static int cluster_num = 0; //static so that each new cluster created has a unique id number (a very useful property to have)
	int i;
	C left = root->children[run_left];
	C right = root->children[run_right];

	if(compress_paths && left->points == 1 && right->points > 1) { //left is a leaf cluster and right isn't.
		right->points++;
		right->list[right->points-1] = left->list[0];
		right->num_children++;
		right->children[right->num_children-1] = left;
		increment_tree_levels(left);
		left->parent = right;
		root->num_children--;
		root->children[run_left] = right;
		for(i = run_right; i < root->points-1; i++) root->children[i] = root->children[i+1];
	} else if(compress_paths && left->points > 1 && right->points == 1) { //right is a leaf cluster and left isn't.
		left->points++;
		left->list[left->points-1] = right->list[0];
		left->num_children++;
		left->children[left->num_children-1] = right;
		increment_tree_levels(right);
		right->parent = left;
		root->num_children--;
		root->children[run_left] = left;
		for(i = run_right; i < root->points-1; i++) root->children[i] = root->children[i+1];
	} else { //both clusters are leaf clusters or both clusters are not leaf clusters, or the user doesn't wish to do path compression
		C new_cluster = (C) malloc(sizeof(struct cluster_node));
		new_cluster->name = (char *) malloc(1000*sizeof(char));
		char temp[1000];
		snprintf(temp, 1000, "%d", cluster_num++);
		strncpy(new_cluster->name, strcat(strdup("cluster"), temp), 1000);
		new_cluster->points = left->points + right->points;
		new_cluster->list = (int *) malloc(root->points*sizeof(int));
		for(i = 0; i < left->points; i++) new_cluster->list[i] = left->list[i];
		for(i = 0; i < right->points; i++) new_cluster->list[left->points+i] = right->list[i];
		new_cluster->level = 1;
		new_cluster->parent = root;
		increment_tree_levels(left);
		left->parent = new_cluster;
		increment_tree_levels(right);
		right->parent = new_cluster;
		new_cluster->num_children = 2;
		new_cluster->children = (C *) malloc(root->points*sizeof(C));
		new_cluster->children[0] = left;
		new_cluster->children[1] = right;
		root->num_children--;
		root->children[run_left] = new_cluster;
		for(i = run_right; i < root->points-1; i++) root->children[i] = root->children[i+1];
	}
}

/***
 * This function takes old_matrix (of length old_lenth) and reduces it into new_matrix (of length old_length-1) by merging the rows/columns at
 * left_index and right_index, and recomputes the similarity between these merged rows/columns and the other rows/columns using the linkage
 * specified by l_type.
***/
void
reduce_sim_matrix(float *old_matrix, float *new_matrix, int old_length, int left_index, int right_index, linkage_type l_type) {
	int old_index, new_index;
	int i, j;
	for(i = 0; i < old_length-1; i++) {
		for(j = 0; j < old_length-1; j++) {
			if(i == left_index && j < right_index) {
				new_index = i*(old_length-1) + j;

				if(l_type == CL_SINGLE) new_matrix[new_index] = maximum(old_matrix[left_index*old_length + j], old_matrix[right_index*old_length + j]);
				else if(l_type == CL_AVERAGE) new_matrix[new_index] = (old_matrix[left_index*old_length + j] + old_matrix[right_index*old_length + j]) / 2;
				else if(l_type == CL_COMPLETE) new_matrix[new_index] = minimum(old_matrix[left_index*old_length + j], old_matrix[right_index*old_length + j]);
			} else if(i == left_index && j >= right_index) {
				new_index = i*(old_length-1) + j;

				if(l_type == CL_SINGLE) new_matrix[new_index] = maximum(old_matrix[left_index*old_length + j+1], old_matrix[right_index*old_length + j+1]);
				else if(l_type == CL_AVERAGE) new_matrix[new_index] = (old_matrix[left_index*old_length + j+1] + old_matrix[right_index*old_length + j+1]) / 2;
				else if(l_type == CL_COMPLETE) new_matrix[new_index] = minimum(old_matrix[left_index*old_length + j+1], old_matrix[right_index*old_length + j+1]);
			} else if(j == left_index && i < right_index) {
				new_index = i*(old_length-1) + j;

				if(l_type == CL_SINGLE) new_matrix[new_index] = maximum(old_matrix[i*old_length + left_index], old_matrix[i*old_length + right_index]);
				else if(l_type == CL_AVERAGE) new_matrix[new_index] = (old_matrix[i*old_length + left_index] + old_matrix[i*old_length + right_index]) / 2;
				else if(l_type == CL_COMPLETE) new_matrix[new_index] = minimum(old_matrix[i*old_length + left_index], old_matrix[i*old_length + right_index]);
			} else if(j == left_index && i >= right_index) {
				new_index = i*(old_length-1) + j;

				if(l_type == CL_SINGLE) new_matrix[new_index] = maximum(old_matrix[(i+1)*old_length + left_index], old_matrix[i*old_length + right_index]);
				else if(l_type == CL_AVERAGE) new_matrix[new_index] = (old_matrix[(i+1)*old_length + left_index] + old_matrix[i*old_length + right_index]) / 2;
				else if(l_type == CL_COMPLETE) new_matrix[new_index] = minimum(old_matrix[(i+1)*old_length + left_index], old_matrix[i*old_length + right_index]);
			} else if(i < right_index && j >= right_index) {
				old_index = i*old_length + j+1;
				new_index = i*(old_length-1) + j;
				new_matrix[new_index] = old_matrix[old_index];
			} else if(i >= right_index && j < right_index) {
				old_index = (i+1)*old_length + j;
				new_index = i*(old_length-1) + j;
				new_matrix[new_index] = old_matrix[old_index];
			} else if(i >= right_index && j >= right_index) {
				old_index = (i+1)*old_length + j+1;
				new_index = i*(old_length-1) + j;
				new_matrix[new_index] = old_matrix[old_index];
			} else {
				old_index = i*old_length + j;
				new_index = i*(old_length-1) + j;
				new_matrix[new_index] = old_matrix[old_index];
			}
		}
	}
}

/***
 * This function increments the levels of a tree node and all of it's children.
***/
void
increment_tree_levels(C node) {
	node->level++;

	int i;
	for(i = 0; i < node->num_children; i++) {
		increment_tree_levels(node->children[i]);
	}
}

/***
 * This function decrements the levels of a tree node and all of it's children.
***/
void
decrement_tree_levels(C node) {
	node->level--;

	int i;
	for(i = 0; i < node->num_children; i++) {
		decrement_tree_levels(node->children[i]);
	}
}

/***
 * This function takes the finished cluster tree and recursively groups together clusters 
 * until the maximum depth of the tree is less than or equal to the max_depth parameter.
***/
void
reduce_tree_depth(C node, int max_depth) {
	if(node->children == NULL || max_depth < 0) return;

	int i;
	if(node->level == max_depth) {
		C parent = node->parent;
		for(i = 0; i < parent->num_children; i++) {
			if(parent->children[i] == node) {
				parent->children[i] = node->children[0];
				node->children[0]->parent = parent;
				decrement_tree_levels(node->children[0]);
				break;
			}
		}
		for(i = 1; i < node->num_children; i++) {
			parent->children[parent->num_children + i - 1] = node->children[i];
			node->children[i]->parent = parent;
			decrement_tree_levels(node->children[i]);
		}
		parent->num_children += node->num_children - 1;

		for(i = 0; i < node->num_children; i++) reduce_tree_depth(node->children[i], max_depth);

		free(node->list);
		free(node->children);
		free(node);
	} else {
		for(i = 0; i < node->num_children; i++) {
			reduce_tree_depth(node->children[i], max_depth);
		}
	}
}

/***
 * This function sets the group numbers for the cluster tree, so that each set of leaf nodes
 * that share a parent have the same group number, but this group number is unique to this
 * cluster only.  No return value, updated clustering hierarchy is stored in root, which is
 * always the first node passed to this function.
***/
void
set_group_numbers(C root) {
	int first_group_number = 1;
	group_numbering_helper(root, first_group_number);
}

/***
 * Recursive helper function for set_group_numbers.
***/
int
group_numbering_helper(C node, int group_number) {
	int has_leaf_children = 0; //boolean variable, does node have any children which are leaf children.
	int i;
	for(i = 0; i < node->num_children; i++) {
		if(node->children[i]->children == NULL) {
			node->children[i]->group = group_number;
			has_leaf_children = 1;
		}
	}

	if(has_leaf_children) group_number++;

	for(i = 0; i < node->num_children; i++) {
		if(node->children[i]->children != NULL) {
			node->children[i]->group = -1;
			fprintf(stderr, "%s: %d\n", node->children[i]->name, group_number);
			group_number = group_numbering_helper(node->children[i], group_number);
		}
	}

	return group_number;
}
