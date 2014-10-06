#!/usr/bin/python

import sys

if len(sys.argv) != 2:
	print 'usage: mod_species_list.py fname'
	exit(1)

fname = sys.argv[1]
with open(fname, 'r') as file:
	reader = file.readlines()
	for row in reader:
		print '<input type=\'checkbox\' name=\'' + row.strip() + '\'>' + row.strip() + '</input><br>'
