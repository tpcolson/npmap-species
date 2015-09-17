#!/bin/sh

rm -rf mxe
mkdir mxe
. /usr/share/modules/init/bash
module load java
java -cp ../backend/maxent/maxent.jar density.Convert . asc mxe mxe

