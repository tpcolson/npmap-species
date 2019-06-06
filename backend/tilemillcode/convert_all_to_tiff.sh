#!/bin/bash

for i in `ls *.asc`; do
    /app/npmap-species/backend/tilemillcode/asc_to_colored_tif $i blue ${i%.*}.tif
done;
