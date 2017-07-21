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
import re

import igc_lib
import my_hash

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
    if body == "":
        return 0
    url = "http://localhost:9200/map/thermals/_bulk"
    response = requests.request("POST", url, body)
    jsonRes = json.loads(response.text)
    if jsonRes['errors']:
        print jsonRes
        print "Error in upload! :O"
        return 1
    return 0

def extract_data_from_file(filename):
    with open(filename, 'r') as content_file:
        content = content_file.read()


    tree = html.fromstring(content)
    igc_download_list = tree.xpath("//td/a[@title='Ladda ner IGC-fil']/@href")
    club_list = tree.xpath("//td/a[@title='Visa klubbens samtliga resultat']/text()")
    pilot_list = tree.xpath("//td/a[contains(@title, 'ttningens samtliga resultat')]/text()")
    return igc_download_list, pilot_list, club_list

def extract_data_from_url(url):
    web = requests.post(url)

    tree = html.fromstring(web.text)
    igc_download_list = tree.xpath("//td/a[@title='Ladda ner IGC-fil']/@href")
    club_list = tree.xpath("//td/a[@title='Visa klubbens samtliga resultat']/text()")
    pilot_list = tree.xpath("//td/a[contains(@title, 'ttningens samtliga resultat')]/text()")

    return igc_download_list, pilot_list, club_list

def createIndex(dId, tNr):
    zeros = 4-len(str(tNr))
    return dId + zeros*"0"+str(tNr)

def upload_flights_from_igc_links(igc_download_list, pilot_list, club_list):

    bulkReq = ""
    downloads = 0
    failedUploads = 0
    counter_for_bulk_upload = 0
    error_flights = 0


    #skicka med ett id på index av igc_download_list + flight.termals listindex
    #skapa id med en function create idstring typ...
    for i in igc_download_list:
        thermalCounter = 0
        if counter_for_bulk_upload == 5:
            print "Uploading " + str(counter_for_bulk_upload) + " flights-worth to Elastic..."
            failedUploads += uploadThermalsToElastic(bulkReq)
            bulkReq = ""
            counter_for_bulk_upload = 0

        if i[0:4] == "http":
            igcURL = i
        else:
            igcURL = "http://www.rst-online.se/" + i ##Link address to igc file

        flightID = i[-4:]

        response = requests.get(igcURL)
        flight = igc_lib.Flight.create_from_str(response.text)

        if not flight.valid:
            error_flights+=1
            with open("error-log.txt", "a") as errfile:
                errfile.write(flightID + ", " + str(flight.notes)+"\n")
            continue

        ## Start-longitude, Start-latitude, Start-höjd, Slut-longitude, Slut-latitude, Slut-höjd, avg-hast, höjdvinst
        for t in flight.thermals:
            thermalCounter+=1
            if 200 < t.alt_change():
                #Prevents DivisionByZero Error
                x, y, z = findThermalOnGround(t.enter_fix.lon, t.enter_fix.lat, t.enter_fix.gnss_alt, t.exit_fix.lon, t.exit_fix.lat, t.exit_fix.gnss_alt)
            else:
                x, y = approxThermal(t.enter_fix.lon, t.enter_fix.lat, t.exit_fix.lon, t.exit_fix.lat)

            if 0 < t.vertical_velocity():
                bulkReq = bulkReq + "{\"index\":{\"_id\":\"" + createIndex( flightID, thermalCounter) +"\"}}\n"
                bulkReq = bulkReq + "{ \"type\" : \"Feature\" , \"properties\" : {\"velocity\":"+ str(t.vertical_velocity()) + ", \"pilot\": \"" + my_hash.hash_string(pilot_list[downloads].encode('utf8')).encode('utf8') + "\", \"club\": \"" + club_list[downloads].encode('utf8') + "\"}, \"geometry\":{\"type\":\"Point\", \"coordinates\": [ " + str(x) + ", " + str(y) + " ]}}\n"
                #Atom slutar med syntax highlight på långa strängar...

                #print "{\"index\":{}}"
                #print json.dumps({ "type" : "Feature" , "properties" : {"velocity":t.vertical_velocity()}, "geometry":{"type":"Point", "coordinates": [x, y]}})

        downloads +=1
        counter_for_bulk_upload +=1

    print "Uploading the last " + str(counter_for_bulk_upload) + " flights-worth to Elastic..."
    failedUploads += uploadThermalsToElastic(bulkReq)

    return downloads, error_flights, failedUploads



def main():
    links = ['2016.html']
    #links = ["http://www.rst-online.se/RSTmain.php?list=1&tab=0&class=1&crew=10066"]
    downloads = 0
    error_flights = 0
    failed_uploads = 0

    for link in links:
        print "Köör nu mfss!!!"
        igc_download_list, pilot_list, club_list = extract_data_from_file(link)
        #igc_download_list, pilot_list, club_list = extract_data_from_url(link)
        d, e, f = upload_flights_from_igc_links(igc_download_list, pilot_list, club_list)
        downloads += d
        error_flights += e
        failed_uploads += f

    print str(downloads) + " - Total IGC files fetched from RST"
    print str(error_flights) + " - Errors in extracting thermals from flights"
    print str(failed_uploads) + " - Errors in uploading packages to Elasticsearch"

    print "Klaar MFS!!!"


if __name__ == "__main__":
    main()
