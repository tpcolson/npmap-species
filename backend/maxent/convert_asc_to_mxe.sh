#!/bin/sh

rm -rf mxe
mkdir mxe
java -Xms4096m -Xmx4096m -cp maxent.jar density.Convert asc asc mxe mxe

