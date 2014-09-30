#!/bin/sh

rm -rf mxe
mkdir mxe
java -cp maxent.jar density.Convert asc asc mxe mxe

