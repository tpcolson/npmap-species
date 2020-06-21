#!/bin/sh

rm -rf mxe
mkdir mxe
java -cp -Xms4096m -Xmx4096m maxent.jar density.Convert asc asc mxe mxe

