#!/bin/sh

rm -rf mxe
mkdir mxe
. /usr/share/modules/init/bash
module load java
java -cp ../nautiluscode/maxent/maxent.jar density.Convert . asc mxe mxe

