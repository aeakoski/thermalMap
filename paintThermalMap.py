# -*- coding: utf-8 -*-
from mpl_toolkits.basemap import Basemap
import matplotlib.pyplot as plt
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

def getCoords():
    ifile = open('res.txt', "rb")
    reader = csv.reader(ifile)
    longitude = []
    latitude = []
    altitude = []

    thermals = []

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

    for i in thermals:
        print(str(i.getPower())+", "+ str(i.getClimb())+", "+ str(i.getDiameter())+", "+ str(i.getNumberOfDataPoints()))
    print(len(thermals))
    print(rowCount)

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

    # The default DPI setting is 96, we're just specifying it here
    # to use it for calculating the number of x-axis pixels to request.
    dpi = 96
    xpixels = dpi * width
    lon, lat = getCoords()

    x,y = map(lon, lat)
    print("Klar med omvandlingen!")

    color1 = '#FFDCAC' #Beige typ
    color2 = '#FFE454' #Yellowwww!
    color3 = '#FF7131' # Orange
    color4 = '#E42F27' #Röd
    color5 = '#BF0118' # Vinröd


    plt.gcf().set_size_inches(width, height)
    map.arcgisimage(service='Canvas/World_Light_Gray_Base', xpixels=xpixels)
    map.scatter(x, y, color=color4, alpha=0.005, marker='o', s=100, linewidths = 0)



    plt.show()


main()
