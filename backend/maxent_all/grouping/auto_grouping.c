#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "clustering.h"

int main(int argc, char **argv) {
	FILE *fp = fopen("sims.arr", "r");
	if(fp == NULL) {
		fprintf(stderr, "couldn't open sims.arr\n");
		exit(1);
	}

	char *line = NULL;
	size_t len = 0;

	if(getline(&line, &len, fp) == -1) {
		fprintf(stderr, "error reading sims.arr\n");
		exit(1);
	}
	int matrix_length;
	sscanf(line, "%d", &matrix_length);

	char **names = (char **) malloc(matrix_length*sizeof(char *));
	int i;
	for(i = 0; i < matrix_length; i++) {
		if(getline(&line, &len, fp) == -1) {
			fprintf(stderr, "error reading sims.arr\n");
			exit(1);
		}
		line[strlen(line)-1] = '\0';
		names[i] = (char *) malloc((strlen(line)+1)*sizeof(char));
		strcpy(names[i], line);
	}

	float *similarity_matrix = (float *) malloc(matrix_length*matrix_length*sizeof(float));
	for(i = 0; i < matrix_length; i++) {
		if(getline(&line, &len, fp) == -1) {
			fprintf(stderr, "error reading sims.arr\n");
			exit(1);
		}

		char *token = strtok(line, " ");
		float val;
		sscanf(token, "%f", &val);
		similarity_matrix[i*matrix_length] = val;
		int j;
		for(j = 1; j < matrix_length; j++) {
			token = strtok(NULL, " ");
			sscanf(token, "%f", &val);
			similarity_matrix[i*matrix_length+j] = val;
		}
	}

	C hierarchy = build_cluster_tree(similarity_matrix, matrix_length, names, 0, -1, CL_AVERAGE);
	FILE *out_fp = fopen("groups.json", "w");
	if(out_fp == NULL) {
		fprintf(stderr, "couldn't open groups.json for writing\n");
		exit(1);
	}
	cluster_tree_to_json(out_fp, hierarchy);
	delete_cluster_tree(hierarchy);

	if(line != NULL) {
		free(line);
	}
	fclose(fp);
}
