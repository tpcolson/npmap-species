#!/bin/bash

rm -rf mxe
mkdir mxe
#. /usr/share/modules/init/bash
#module load java
java -Xms4096m -Xmx4096m -cp ../backend/maxent/maxent.jar density.Convert . asc mxe mxe

