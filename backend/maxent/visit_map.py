# script to extract pictures from VisIt
# visit -nowin -cli -s pictures.py -np 4
import os
import sys
import glob

# this function to make color table from
#     http://visitusers.org/index.php?title=Creating_a_color_table

def MakeRGBColorTable(name, ct):
    ccpl = ColorControlPointList()
    for pt in ct:
        p = ColorControlPoint()
        #p.colors = (pt[0] * 255, pt[1] * 255, pt[2] * 255, 255)
        p.colors = (pt[0], pt[1], pt[2], 255)
        p.position = pt[3]
        ccpl.AddControlPoints(p)
    AddColorTable(name, ccpl)
 

outputDir = '../png'
bovPath = '../maxent_results'
xyPath = '../by_species'

speciesName = None
#commonName = None
threshold = None
for i in range(len(sys.argv)):
   if(sys.argv[i] == "-species"):
      if(i + 1 < len(sys.argv)):
         speciesName = sys.argv[i+1]
   #if(sys.argv[i] == "-common"):
      #if(i + 1 < len(sys.argv)):
         #commonName = sys.argv[i+1]
   if(sys.argv[i] == "-threshold"):
      if(i + 1 < len(sys.argv)):
         threshold = sys.argv[i+1]

if speciesName is None:
   print ("You must pass a species name with -species")
   sys.exit(1)
#if commonName is None:
   #print ("You must pass a species common name with -common")
   #sys.exit(1)
if threshold is None:
   print ("You must pass a threshold value with -threshold")
   sys.exit(1)

#speciesName = os.path.basename(speciesName)

#Title = CreateAnnotationObject("Text2D")
#Title.visible = 1
#Title.position = (0.03, 0.86) #range [0,1]
#Title.width = 0.50 #percentage
#Title.useForegroundForTextColor = 1

# make brown-to-green color table
ct = ((168,123,13,0.0), (240,203,93,0.5), (0,128,0,1))
MakeRGBColorTable("smokies", ct)

#print "current file is: " + infile
#i = len(path)
#e = len(infile)
#e = e - len(".bov")
#speciesName = infile[i:e]
#print "speciesName: " + speciesName
OpenDatabase("localhost:"+bovPath+"/"+speciesName+"/avg.bov")
# CHANGED NAME OF VARIABLE
#AddPlot("Pseudocolor", "data", 1, 1)
#AddPlot("Pseudocolor", "presence", 1, 1)
AddPlot("Pseudocolor", "presence")




# add a contour plot for threshold line
#AddPlot("Contour", "presence", 1, 0)


# second argument to all AddOperator calls is 1=true, for applying to all
#     plots

# add threshold with lower limit 0
AddOperator("Threshold", 1)
Threshold = ThresholdAttributes()
Threshold.lowerBounds = (0)
SetOperatorOptions(Threshold, 1)

# reflect over x-axis
AddOperator("Reflect", 1)
Reflect = ReflectAttributes()
Reflect.reflections = (0, 0, 1, 0, 0, 0, 0, 0)
SetOperatorOptions(Reflect, 1)

# adding a transform to correct coordinates after reflect
AddOperator("Transform", 1)
ta = TransformAttributes()
ta.doTranslate = 1
ta.translateX = 0
ta.translateY = 39060
ta.translateZ = 0
SetOperatorOptions(ta, 1)

# Kim didn't have this--I don't know how her script worked without it
pa = PseudocolorAttributes()
#pa.minFlag = 1
#pa.maxFlag = 1
#pa.min = 0
#pa.max = 1
pa.limitsMode = pa.CurrentPlot
pa.colorTableName = 'smokies'
SetPlotOptions(pa)

# add contour (the ones are needed so operators apply to this plot as well)
AddPlot("Contour", "presence",1,1)
ca = ContourAttributes()
ca.contourMethod = ca.Value
#ca.contourValue = (0.5)
ca.contourValue = float(threshold)
ca.colorType = ca.ColorByMultipleColors
ca.SetMultiColor(0, (255, 255, 255, 255))
SetPlotOptions(ca)

# read in csv file to plot point mesh of original sample points
opts = GetDefaultFileOpenOptions("PlainText")
opts["First row has variable names"] = 1
#opts["Lines to skip at beginning of file"] = 1
opts["Column for X coordinate (or -1 for none)"] = 1
opts["Column for Y coordinate (or -1 for none)"] = 2
opts["Column for Z coordinate (or -1 for none)"] = -1
SetDefaultFileOpenOptions("PlainText", opts)

# fix for cv species names that have appended index (eg Rubus--species_4)
#parts = speciesName.partition('_')
OpenDatabase("localhost:"+ xyPath + "/" + speciesName + ".csv")
#OpenDatabase("localhost:"+ xyPath + "/" + parts[0] + ".csv")
AddPlot("Mesh", "mesh", 1, 0)

# make points on mesh a little bigger
ma = MeshAttributes()
ma.pointSizePixels = 8
SetPlotOptions(ma)

# change Annotations on the graph
Annotation = AnnotationAttributes()
Annotation.userInfoFlag = 0
Annotation.axes2D.visible = 0
Annotation.userInfoFlag = 0
Annotation.databaseInfoFlag = 0
Annotation.legendInfoFlag = 0
Annotation.axesArray.visible = 0
SetAnnotationAttributes(Annotation)

# make title for graph (2D text box)
#Title.text = "          " + speciesName + "         "

#spaces = 28 - len(commonName)
#paddedName = commonName + ' '*spaces
#Title.text = paddedName

# kim didn't have these settings either
va = View2DAttributes()
#print va
va.windowCoords = (228094,315064,3923599,3962659)
va.viewportCoords = (0,1,0,1)
va.fullFrameActivationMode = va.Off
#print va
SetView2D(va)

# draw and save plot
DrawPlots()
#InvertBackgroundColor()

SaveAtts = SaveWindowAttributes()
SaveAtts.outputToCurrentDirectory = 0
#SaveAtts.outputDirectory = path + "/pictures"
#print "   saving to "+SaveAtts.outputDirectory
SaveAtts.outputDirectory = outputDir
SaveAtts.fileName = speciesName
SaveAtts.family = 0  # this keeps it from appending numbers to filename
SaveAtts.format = SaveAtts.PNG
SaveAtts.width = 2899 # birds&Trees = 677, birds = 886, trees = 889
SaveAtts.height = 1302 # birds&Trees = 256, birds = 341, trees = 438
SaveAtts.quality = 100
SaveAtts.resConstraint = SaveAtts.NoConstraint
SetSaveWindowAttributes(SaveAtts)
name = SaveWindow()
# close file and exit
DeleteActivePlots()
sys.exit()

