# -*- coding: utf-8 -*-
from mpl_toolkits.basemap import Basemap
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np
import csv
import sys

from Thermal import Thermal

weakThermals = []
mediumThermals = []
hardThermals = []
veryHardThermals = []
extremeThermals = []
onceInALifeTimeThermals = []
thermals = []

def getCoords():
    ifile = open('res.txt', "rb")
    reader = csv.reader(ifile)
    longitude = []
    latitude = []
    altitude = []

    first = True
    rowCount = 0
    for row in reader:
        rowCount+=1
        sameThermal = False

        if first:
            first = False
        elif abs(altitude[-1] - float(row[2]) < 50): #Avgör om vi fortfarande kurvar i samma blåsa som tidigare datapunkt
            if abs(latitude[-1] - float(row[0])) < 0.1:
                if abs(longitude[-1] - float(row[1])) < 0.1:
                    if int(row[3]) < 60 and 0 < int(row[3]):
                        thermals[-1].addDataPoint([float(row[0]), float(row[1]), int(row[2]), int(row[3])])
                        sameThermal = True
        '''
                    else:
                        print("Timeout " + str(row[3]))

                else:
                    print("Longitude " + str(longitude[-1]) + " - " + str(row[1]))
            else:
                print("Latitude")
        else:
            print("Altitude!")
        '''
        #Sortera in termikblåsorna i kategorierr efter styrka
        if not sameThermal: #Om vi inte är i samma blåsa som tidigare, skapa en ny blåsa! men innan det, spara den gammla blåsan i rätt lista

            if len(thermals) == 0:
                pass
            elif thermals[-1].getNumberOfDataPoints() < 3:
                pass
            elif thermals[-1].getPower() < 1:
                weakThermals.append(thermals[-1])
            elif thermals[-1].getPower() < 2:
                mediumThermals.append(thermals[-1])
            elif thermals[-1].getPower() < 3:
                hardThermals.append(thermals[-1])
            elif thermals[-1].getPower() < 4:
                veryHardThermals.append(thermals[-1])
            elif thermals[-1].getPower() < 5:
                extremeThermals.append(thermals[-1])
            else:
                onceInALifeTimeThermals.append(thermals[-1])

            thermals.append(Thermal())
            thermals[-1].addDataPoint(row)

        altitude.append(float(row[2]))
        longitude.append(float(row[1]))
        latitude.append(float(row[0]))

        c = 0
    for i in thermals:
        i.calculateData()
        if(20 < i.getClimb()):
            print(str(c)+", "+str(i.getPower())+", "+ str(i.getClimb())+", "+ str(i.getDiameter())+", "+ str(i.getSpeed())+", "+ str(i.getNumberOfDataPoints()))
        c+=1
    print("Antal vindar: " + str(len(thermals)))
    print("Totala datapunkter: " + str(rowCount))

    ifile.close()
    return longitude, latitude


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
    lon, lat = getCoords() ##Create all the thermals
    #x,y = map(lon, lat)
    print("Klar med omvandlingen!")

    color1 = '#FFDCAC' #Beige typ
    color2 = '#FFE454' #Yellowwww!
    color3 = '#FF7131' # Orange
    color4 = '#E42F27' #Röd
    color5 = '#BF0118' # Vinröd

    #nr = int(input("Pick a thermal to plot: "))
    #xx, yy, alt = thermals[nr].getPlotData()
    #print(xx)
    #print(yy)
    #ax.scatter(yy, xx, alt, c = color4, marker = 'o')


    plt.gcf().set_size_inches(width, height)
    map.arcgisimage(service='Canvas/World_Light_Gray_Base', xpixels=xpixels)

    print("Nedladdning klar!")

    for t in weakThermals:
        xt,yt = t.getGroundCenter()
        print(xt,yt)
        x,y = map(xt, yt)
        map.scatter(x, y, color=color1, alpha=0.001, marker='o', s=100, linewidths = 0)
    print("1 klar!")
    for t in mediumThermals:
        xt,yt = t.getGroundCenter()
        x,y = map(xt, yt)
        map.scatter(x, y, color=color2, alpha=0.02, marker='o', s=100, linewidths = 0)
    print("2 klar!")
    for t in hardThermals:
        xt,yt = t.getGroundCenter()
        x,y = map(xt, yt)
        map.scatter(x, y, color=color3, alpha=0.03, marker='o', s=100, linewidths = 0)
    print("3 klar!")
    for t in veryHardThermals:
        xt,yt = t.getGroundCenter()
        x,y = map(xt, yt)
        map.scatter(x, y, color=color4, alpha=0.04, marker='o', s=100, linewidths = 0)
    print("4 klar!")
    for t in extremeThermals:
        xt,yt = t.getGroundCenter()
        x,y = map(xt, yt)
        map.scatter(x, y, color=color5, alpha=0.05, marker='o', s=100, linewidths = 0)
    print("5 klar!")
    for t in onceInALifeTimeThermals:
        xt,yt = t.getGroundCenter()
        x,y = map(xt, yt)
        map.scatter(x, y, color=color5, alpha=0.05, marker='o', s=100, linewidths = 0)
    print("6 klar!")


    plt.show()


main()
