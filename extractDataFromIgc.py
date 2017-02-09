# -*- coding: utf-8 -*-

from sys import stdin
import time

oldLn = []

kopplat = False
topHeight = 0

for line in stdin:
    newLn = []
    if (float(line[7:14]) - float(line[15:23]) < 0.001):
        continue
    if topHeight == 0:
        topHeight = int(line[25:30])
        continue

    if not kopplat:
        if int(line[25:30]) > topHeight: # Nytt höggsta
            topHeight = int(line[25:30])
        elif topHeight - int(line[25:30]) > 5: # Kopplat ur
            kopplat = True
            oldLn.append(line[1:7]) #Time
            oldLn.append(line[7:14]) #North
            oldLn.append(line[15:23]) #West
            oldLn.append(int(line[25:30])) #Alt
            #print("Kopplat vid " + line[25:30] + " meter!")
        continue

    #Nu har han kopplat!
    newLn.append(line[1:7]) #Time
    newLn.append(line[7:14]) #North
    newLn.append(line[15:23]) #West
    newLn.append(int(line[25:30])) #Alt

    if newLn[3] < 100: #Skriv inte ut raden om vi håller på att landa
        continue

    northDecimal = float(newLn[1][0:2]) + float(newLn[1][2:4]+"."+newLn[1][4:])/60
    eastDeciaml = float(newLn[2][0:3]) + float(newLn[2][3:5]+"."+newLn[1][5:])/60

    if oldLn[3] < newLn[3]: #Skriv bara ut raden om vi har stigit sedan förra datapunkten
        oldH = int(oldLn[0][1:3])
        oldM = int(oldLn[0][3:5])
        oldS = int(oldLn[0][5:7])

        newH = int(newLn[0][1:3])
        newM = int(newLn[0][3:5])
        newS = int(newLn[0][5:7])

        diffH = newH - oldH
        diffM = newM - oldM
        diffS = newS - oldS

        print(str(northDecimal)[:6] + "," + str(eastDeciaml)[:6] + "," + str(newLn[3]-oldLn[3]) + "," + str(diffH*3600 + diffM*60 + diffS))
    oldLn = newLn
