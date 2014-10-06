#!/bin/sh

rm -rf mxe
mkdir mxe
java -cp ../nautiluscode/maxent/maxent.jar density.Convert . asc mxe mxe

