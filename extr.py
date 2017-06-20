# coding=utf-8
#!/usr/bin/env python

"""

ls igcfiles | grep ".igc" -i | python extr.py

Nästa steg, anv. Linjär algebra för en linje i 3d och hitta vart den skär z = 0, dvs jordytan.
Gör detta då termikblåsan har en höjdvinst på typ över 100-200 meter. Om ett för lågt värde tas kan apoximationen bli helt kaiko!


"""
import itertools
import os
import sys
import math

import igc_lib

import fileinput

def findThermalOnGround(x1, y1, z1, x2, y2, z2):
    ##Approximates thermal origin on ground using standard linear algebra
    k =(x2-x1, y2-y1, z2-z1)
    m = (x1, y1, z1)
    t = -m[2] / k[2]
    return k[0]*t+m[0], k[1]*t+m[1], k[2]*t+m[2]

def approxThermal(x1, y1, x2, y2):
    #Aproximats thermal center only regarding its enter and exit point
    return ((x2-x1)/2) + x1, ((y2-y1)/2) + y1


def main():
    for line in fileinput.input():
        input_file = "igcfiles/" + str(line.strip())

        flight = igc_lib.Flight.create_from_file(input_file)
        if not flight.valid:
            with open("error-log.txt", "a") as errfile:
                errfile.write(input_file + ", " + str(flight.notes))
        else:
            ## Start-longitude, Start-latitude, Start-höjd, Slut-longitude, Slut-latitude, Slut-höjd, avg-hast, höjdvinst
            for t in flight.thermals:
                #print t.enter_fix.lon, t.enter_fix.lat, t.enter_fix.gnss_alt, t.exit_fix.lon, t.exit_fix.lat, t.exit_fix.gnss_alt, t.vertical_velocity(), t.alt_change()

                if t.alt_change() > 200:
                    #Prevents DivisionByZero Error
                    x, y, z = findThermalOnGround(t.enter_fix.lon, t.enter_fix.lat, t.enter_fix.gnss_alt, t.exit_fix.lon, t.exit_fix.lat, t.exit_fix.gnss_alt)
                else:
                    x, y = approxThermal(t.enter_fix.lon, t.enter_fix.lat, t.exit_fix.lon, t.exit_fix.lat)
                    pass
                if t.vertical_velocity() > 0:
                    print str(x) + ", " + str(y) + ", " + str(t.vertical_velocity())


            #print input_file + " " + str(len(flight.thermals))
if __name__ == "__main__":
    main()
