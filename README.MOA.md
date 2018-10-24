Notes on how rerunning this went and what to avoid in the future
===

First get all the environmentallayers 
Make sure the environmantal layers are from the same year, otherwise they'll cause conflicts

Make sure the ATBI records have been gathered and that the files are not empty inside!
separate.sh no longer works, first delete the ATBI_Files directory and run python separate.py
Inside separate.py make sure the f.write lines are not commented out!!

Go to the maxent directory and look at do_run.sh
Make sure you set the gdal bin to something else if it's still pointing to Lonnie's directory
