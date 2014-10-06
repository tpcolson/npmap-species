#!/usr/bin/python

import csv
import sys

if len(sys.argv) != 2:
	print 'usage: build_species_list.py fname'
	exit(1)

fname = sys.argv[1]
species = []

with open(fname, 'rb') as csvfile:
	reader = csv.reader(csvfile)
	for row in reader:
		sp = row[0].strip().replace('_', ' ').capitalize()
		if row[0] != 'Taxon' and not sp in species:
			species.append(sp)

species.sort()
for sp in species:
	print sp
