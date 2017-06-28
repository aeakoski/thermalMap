# coding=utf-8
#!/usr/bin/env python

"""

ls igcfiles | grep ".igc" -i | python extr.py | python tMap.py

sudo /etc/init.d/elasticsearch start

Nästa steg, anv. Linjär algebra för en linje i 3d och hitta vart den skär z = 0, dvs jordytan.
Gör detta då termikblåsan har en höjdvinst på typ över 100-200 meter. Om ett för lågt värde tas kan apoximationen bli helt kaiko!


"""
import itertools
import os
import sys
import math
import json
import requests
from lxml import html
import urllib2
import re

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

def uploadThermalsToElastic(body):
    url = "http://127.0.0.1:9200/map/thermals/_bulk"
    response = requests.request("POST", url, data = body)
    jsonRes = json.loads(response.text)
    if jsonRes['errors']:
        print jsonRes
        print "Error in upload! :O"
        return 1
    return 0


def main():
    bulkReq = ""
    web = urllib2.urlopen('http://www.rst-online.se/RSTmain.php?list=1&tab=0&class=1&crew=10161')
    data = web.read()
    web.close()

    tree = html.fromstring(data)

    igc_download_list = tree.xpath("//tbody/tr/td/a[@title= 'Ladda ner IGC-fil']/@href")
    club_list = tree.xpath("//tbody/tr/td/a[@title= 'Visa klubbens samtliga resultat']/text()")
    pilot_list = tree.xpath("//tbody/tr/td/a[contains(@title, 'ttningens samtliga resultat')]/text()")

    downloads = 0
    failedUploads = 0
    counter_for_bulk_upload = 0
    error_flights = 0

    for i in igc_download_list:

        if counter_for_bulk_upload == 5:
            print "Uploading " + str(counter_for_bulk_upload) + " flights-worth to Elastic..."
            failedUploads += uploadThermalsToElastic(bulkReq)
            bulkReq = ""
            counter_for_bulk_upload = 0

        igcURL = "http://www.rst-online.se/" + i ##Link address to igc file
        response = urllib2.urlopen(igcURL)

        flight = igc_lib.Flight.create_from_str(response.read())

        if not flight.valid:
            error_flights+=1
            continue

        ## Start-longitude, Start-latitude, Start-höjd, Slut-longitude, Slut-latitude, Slut-höjd, avg-hast, höjdvinst
        for t in flight.thermals:

            if 200 < t.alt_change():
                #Prevents DivisionByZero Error
                x, y, z = findThermalOnGround(t.enter_fix.lon, t.enter_fix.lat, t.enter_fix.gnss_alt, t.exit_fix.lon, t.exit_fix.lat, t.exit_fix.gnss_alt)
            else:
                x, y = approxThermal(t.enter_fix.lon, t.enter_fix.lat, t.exit_fix.lon, t.exit_fix.lat)

            if 0 < t.vertical_velocity():
                bulkReq = bulkReq + "{\"index\":{}}\n"
                bulkReq = bulkReq + "{ \"type\" : \"Feature\" , \"properties\" : {\"velocity\":"+ str(t.vertical_velocity()) + ", \"pilot\": \"" + pilot_list[downloads].encode('utf8') + "\", \"club\": \"" + club_list[downloads].encode('utf8') + "\"}, \"geometry\":{\"type\":\"Point\", \"coordinates\": [ " + str(x) + ", " + str(y) + " ]}}\n"
                #Atom slutar med syntax highlight på långa strängar...

                #print "{\"index\":{}}"
                #print json.dumps({ "type" : "Feature" , "properties" : {"velocity":t.vertical_velocity()}, "geometry":{"type":"Point", "coordinates": [x, y]}})

        downloads +=1
        counter_for_bulk_upload +=1
        print downloads

    print "Uploading the last " + str(counter_for_bulk_upload) + " flights-worth to Elastic..."
    failedUploads += uploadThermalsToElastic(bulkReq)
    print str(downloads) + " - Total IGC files fetched from RST"
    print str(error_flights) + " - Errors in extracting thermals from flights"
    print str(failedUploads) + " - Errors in uploading packages to Elasticsearch"

    print "Klaar MFS!!!"





if __name__ == "__main__":
    main()
