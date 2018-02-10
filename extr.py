# coding=utf-8
#!/usr/bin/env python

"""

ls igcfiles | grep ".igc" -i | python extr.py | python tMap.py

sudo /etc/init.d/elasticsearch start


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
import hash2

import fileinput

reload(sys)
sys.setdefaultencoding("utf-8")

s = requests.session()
s.keep_alive = False

colisionTable = {}

def checkColission(key, value):
    try:
        if value != colisionTable[key]:
            print "\n\n\n\n\n\n\n-----\n\n\n\n\n\n"
            raise ValueError("Colission: " + str(value) + " - " + str(colisionTable[key]))
        else:
            print "Fanns redan: " + value + " - " + str(colisionTable[key])
        print "No Collision"
    except KeyError:
        print "Lägger till pilot " + value
        colisionTable[key] = value

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
    url = "http://37.139.3.211:9200/map/thermals/_bulk"
    tries = 5

    while tries != 0:
        if body == "":
            return 0
        response = s.request("POST", url, data = body)
        jsonRes = json.loads(response.text)
        if jsonRes['errors']:
            print jsonRes
            tries -= 1
        else:
            break
    if tries:
        return 0
    else:
        return 1

def extract_data_from_file(filename):
    with open(filename, 'r') as content_file:
        content = content_file.read()

    content = content.replace("<br>", "-") #Fixar buggen med att pilotlistan blir för stor pga tvåmannalag
    content = content.replace("sterdalarn...", "sterdalarnas FK") #Fixar buggen med att pilotlistan blir för stor pga tvåmannalag
    content = content.replace("Hultsfed Se...", "Hultsfred Segelflygklubb") #Fixar buggen med attpilotlistan blir för stor pga tvåmannalag

    tree = html.fromstring(content)
    igc_download_list = tree.xpath("//td/a[@title='Ladda ner IGC-fil']/@href")
    club_list = tree.xpath("//td/a[@title='Visa klubbens samtliga resultat']/text()")
    pilot_list = tree.xpath("//td/a[contains(@title, 'ttningens samtliga resultat')]/text()")

    print "Listornas längder:"
    print len(igc_download_list)
    print len(club_list)
    print len(pilot_list)
    print " ---------- "
    if (len(igc_download_list) != len(club_list)) or (len(club_list) != len(pilot_list)):
        print len(igc_download_list), len(club_list), len(pilot_list)
        raise ValueError
    return igc_download_list, pilot_list, club_list

def extract_data_from_url(url):
    web = s.post(url)

    tree = html.fromstring(web.text)
    igc_download_list = tree.xpath("//td/a[@title='Ladda ner IGC-fil']/@href")
    club_list = tree.xpath("//td/a[@title='Visa klubbens samtliga resultat']/text()")
    pilot_list = tree.xpath("//td/a[contains(@title, 'ttningens samtliga resultat')]/text()")

    return igc_download_list, pilot_list, club_list

def createIndex(dId, tNr):
    zeros = 4-len(str(tNr))
    return dId + zeros*"0"+str(tNr)

def upload_flights_from_igc_links(igc_download_list, pilot_list, club_list, startAt):

    bulkReq = ""
    downloads = startAt
    failedUploads = 0
    counter_for_bulk_upload = 0
    error_flights = 0


    #skicka med ett id på index av igc_download_list + flight.termals listindex
    #skapa id med en function create idstring typ...
    for i in igc_download_list:
        thermalCounter = 0
        if counter_for_bulk_upload == 20:
            print "Uploading " + str(counter_for_bulk_upload) + " flights-worth to Elastic..." + str(downloads)+"/" + str(len(igc_download_list))
            failedUploads += uploadThermalsToElastic(bulkReq)
            bulkReq = ""
            counter_for_bulk_upload = 0
            f = open("where.txt", "w")
            f.write(str(downloads))
            f.close()

        if i[0:4] == "http":
            igcURL = i
        else:
            igcURL = "http://www.rst-online.se/" + i ##Link address to igc file

        flightID = i[-4:]

        ## ------------------------------- DEBUG-FILTER ------------------------------ ##
        """
        if club_list[downloads] != "Ö Sörmlands Fk":
            downloads+=1

            continue
        """
        ## ------------------------------- ------ ------------------------------ ##

        tries = 5
        while tries != 0:
            try:
                response = s.get(igcURL)
                tries  = 0
                print flightID
            except requests.exceptions.ConnectionError:
                print "Connection Error till RSTs ervrar"
                tries -= 1

        flight = igc_lib.Flight.create_from_str(response.text)

        if not flight.valid:
            error_flights+=1
            with open("error-log.txt", "a") as errfile:
                errfile.write(flightID + ", " + str(flight.notes)+"\n")
            continue


        print hash2.hasha(pilot_list[downloads].encode('utf8')).encode('utf8')
        print pilot_list[downloads].encode('utf8')
        print club_list[downloads].encode('utf8')

        checkColission(hash2.hasha(pilot_list[downloads].encode('utf8')).encode('utf8'), pilot_list[downloads].encode('utf8'))

        print " --- "
        print "  "

        ## Start-longitude, Start-latitude, Start-höjd, Slut-longitude, Slut-latitude, Slut-höjd, avg-hast, höjdvinst
        for t in flight.thermals:
            thermalCounter+=1
            if 200 < t.alt_change():
                #Prevents bad aproximations
                try:
                    x, y, z = findThermalOnGround(t.enter_fix.lon, t.enter_fix.lat, t.enter_fix.gnss_alt, t.exit_fix.lon, t.exit_fix.lat, t.exit_fix.gnss_alt)
                except ZeroDivisionError:
                    x, y = approxThermal(t.enter_fix.lon, t.enter_fix.lat, t.exit_fix.lon, t.exit_fix.lat)
            else:
                x, y = approxThermal(t.enter_fix.lon, t.enter_fix.lat, t.exit_fix.lon, t.exit_fix.lat)

            if 0 < t.vertical_velocity():
                bulkReq = bulkReq + "{\"index\":{\"_id\":\"" + createIndex( flightID, thermalCounter) +"\"}}\n"
                bulkReq = bulkReq + "{ \"type\" : \"Feature\" , \"properties\" : {\"velocity\":"+ str(t.vertical_velocity()) + ", \"pilot\":\"" + hash2.hasha(pilot_list[downloads].encode('utf8')).encode('utf8') + "\", \"club\": \"" + club_list[downloads].encode('utf8') + "\"}, \"geometry\":{\"type\":\"Point\", \"coordinates\": [ " + str(x) + ", " + str(y) + " ]}}\n"
                #Atom slutar med syntax highlight på långa strängar...

                #print "{\"index\":{}}"
                #print json.dumps({ "type" : "Feature" , "properties" : {"velocity":t.vertical_velocity()}, "geometry":{"type":"Point", "coordinates": [x, y]}})

        downloads +=1
        counter_for_bulk_upload +=1

    print "Uploading the last " + str(counter_for_bulk_upload) + " flights-worth to Elastic..."
    failedUploads += uploadThermalsToElastic(bulkReq)

    return downloads, error_flights, failedUploads

## 2012 ~1100
## 2013 ~1700
## 2014 1800
## 2015 1300
## 2016 1800
## 2017

##Signal App


def main():
    links = ['2017.html']
    #links = ["http://www.rst-online.se/RSTmain.php?list=1&tab=0&class=1&crew=10066"]
    downloads = 0
    f = open("where.txt", "r")
    startAt = int(f.readline().strip())
    print "Börjar hämta flygning nr "+ str(startAt)

    f.close()
    error_flights = 0
    failed_uploads = 0

    for link in links:
        print link
        igc_download_list, pilot_list, club_list = extract_data_from_file(link)
        #igc_download_list, pilot_list, club_list = extract_data_from_url(link)
        d, e, f = upload_flights_from_igc_links(igc_download_list[startAt:], pilot_list, club_list, startAt)
        downloads += d
        error_flights += e
        failed_uploads += f
        print " ---------- "

    print str(downloads) + " - Total IGC files fetched from RST"
    print str(error_flights) + " - Errors in extracting thermals from flights"
    print str(failed_uploads) + " - Errors in uploading packages to Elasticsearch"

    f = open("where.txt", "w")
    f.write("0")
    f.close()

    print "Klaar MFS!!!"


if __name__ == "__main__":
    main()
