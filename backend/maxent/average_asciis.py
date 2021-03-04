import os
import numpy

bugged_data = 1

dir_name = 'maxent_results'
file_postfix = '_avg.asc'
avg_file = 'park_avg.asc'

counter = 0
for root, directories, files in os.walk(dir_name):
    for dir in directories:
        path = os.path.join(root, dir)
        for name in os.listdir(path):
            if file_postfix in name:
                print(os.path.join(path, name))
                with open(os.path.join(path, name), 'r') as f:
                    lines = f.readlines()
                    f.close()
                    if counter == 0:
                        ncols = int(lines[0].split()[1])
                        nrows = int(lines[1].split()[1])
                        xllcorner = lines[2].split()[1]
                        yllcorner = lines[3].split()[1]
                        cellsize = lines[4].split()[1]
                        nodata_value = lines[5].split()[1]
                        if bugged_data:
                            temp = ncols
                            ncols = nrows
                            nrows = temp
                        data = numpy.zeros((nrows, ncols))

                    for i, line in enumerate(lines[6:]):
                        temp = numpy.array(line.split(), dtype=float)
                        data[i] = numpy.add(data[i], temp)
                counter = counter + 1
print("Dividing matrix by " + str(counter))
data = numpy.divide(data, counter)

# Write park averaged ascii file
print("Writing ascii file.")
with open(avg_file, 'w') as f:
    if bugged_data:
        f.write("{:<14}{}\n".format("ncols", nrows))
        f.write("{:<14}{}\n".format("nrows", ncols))
    else:
        f.write("{:<14}{}\n".format("ncols", ncols))
        f.write("{:<14}{}\n".format("nrows", nrows))
    f.write("{:<14}{}\n".format("xllcorner", xllcorner))
    f.write("{:<14}{}\n".format("yllcorner", yllcorner))
    f.write("{:<14}{}\n".format("cellsize", cellsize))
    f.write("{:<14}{}\n".format("NODATA_value", nodata_value))

    for i in range(nrows):
        for j in range(ncols):
            f.write("{} ".format(data[i][j]))
        f.write('\n')
