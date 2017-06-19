# coding=utf-8
#!/usr/bin/env python

"""

ls igcfiles | grep ".igc" -i | python extr.py

"""
import itertools
import os
import sys

import igc_lib

import fileinput


def main():
    for line in fileinput.input():
        input_file = "igcfiles/" + str(line.strip())


        flight = igc_lib.Flight.create_from_file(input_file)
        if not flight.valid:
            with open("test.txt", "a") as errfile:
                errfile.write(input_file + ", " + str(flight.notes))
        else:
            ## Start-longitude, Start-latitude, Start-höjd, Slut-longitude, Slut-latitude, Slut-höjd, avg-hast, höjdvinst

            for t in flight.thermals:
        	       print t.enter_fix.lon, t.enter_fix.lat, t.enter_fix.gnss_alt, t.exit_fix.lon, t.exit_fix.lat, t.exit_fix.gnss_alt, t.vertical_velocity(), t.alt_change()

            #print input_file + " " + str(len(flight.thermals))
if __name__ == "__main__":
    main()
