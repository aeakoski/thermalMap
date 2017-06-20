# -*- coding: utf-8 -*-
from mpl_toolkits.basemap import Basemap
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np
import csv
import sys
import fileinput



def main():
    map = Basemap(urcrnrlat=59.4,     # top
                  urcrnrlon=17.6,   # bottom
                  llcrnrlat=58.9,     # left
                  llcrnrlon=16.84,   # right
                  epsg=3857)

    # These are the dimensions of the map we'll create
    width = 40
    height = 20

    fig = plt.gcf()
    fig.set_size_inches(width, height);

    #fig = plt.figure()
    #ax = fig.add_subplot(111, projection='3d')


    # The default DPI setting is 96, we're just specifying it here
    # to use it for calculating the number of x-axis pixels to request.
    dpi = 96
    xpixels = dpi * width

    color1 = '#FFDCAC' #Beige typ
    color2 = '#FFE454' #Yellowwww!
    color3 = '#FF7131' # Orange
    color4 = '#E42F27' #Röd
    color5 = '#BF0118' # Vinröd

    plt.gcf().set_size_inches(width, height)
    map.arcgisimage(service='Canvas/World_Light_Gray_Base', xpixels=xpixels)

    for t in fileinput.input():
        thermal = t.strip().split(",")
        #print thermal
        xt = float(thermal[0])
        yt = float(thermal[1])
        ##print(xt,yt)
        x,y = map(xt, yt)
        map.scatter(x, y, color=color5, alpha=0.1, marker='o', s=100, linewidths = 0)

    print("Klar!")
    plt.show()


main()
