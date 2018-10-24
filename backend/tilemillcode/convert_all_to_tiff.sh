#!/bin/bash

for i in `ls *.asc`; do
    ./asc_to_colored_tif $i blue ${i%.*}.tif
done;
