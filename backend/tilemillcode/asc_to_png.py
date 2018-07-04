#!/usr/bin/env python

import numpy as np
from PIL import Image
import sys

if __name__ == '__main__':
    inp = sys.argv[1]
    out = inp.replace('.asc', '.png')
    with open(inp) as f:
        _, width = f.readline().strip().split()
        _, height = f.readline().strip().split()
        width, height = int(width), int(height)
        
        # pass xllcorner, yllcorner and cellsize for now
        for i in range(3):
            f.readline()

        _, fillvalue = f.readline().strip().split()
        fillvalue = int(float(fillvalue))

        # Create the image
        img = []

        for i in range(height):
            row = f.readline().strip().split()
            row_data = [float(x) for x in row]
            img.append(row_data)

        img = np.array(img)
        img[img == int(fillvalue)] = 0
        img = img / np.max(img) * 255.0 
        img = Image.fromarray(img)
        img2 = img.convert('L')
        img2.save(out)

