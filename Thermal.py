# -*- coding: utf-8 -*-
import math

class Thermal(object):
    """docstring for Thermal."""
    def __init__(self):
        self.dataList = []
        self.power = 0
        self.groundCenter = (0, 0)
        self.radious = 0
        self.powersum = 0
        self.top = 0
        self.enter = 0

    def addDataPoint(self, dataPoint):
        if self.top < int(dataPoint[2]):
            self.top = int(dataPoint[2])

        if self.enter == 0:
            self.enter = int(dataPoint[2])
        else:
            pTemp = (float(dataPoint[2])/float(dataPoint[3]))
            if 0 < pTemp:
                self.powersum+=(float(dataPoint[2])/float(dataPoint[3]))

        self.dataList.append([float(dataPoint[0]), float(dataPoint[1]), int(dataPoint[2]), int(dataPoint[3])])


    def getGroundCenter(self):
        #Calculate GC
        pass

    def getDiameter(self):
        if(len(self.dataList) < 3):
            return 0
        try:
            kStart = (self.dataList[1][0]-self.dataList[0][0])/(self.dataList[1][1]-self.dataList[0][1])
        except ZeroDivisionError:
            kStart = (self.dataList[1][0]-self.dataList[0][0])/(self.dataList[1][1]-self.dataList[0][1]+0.00001)
        try:
            kNext = (self.dataList[2][0]-self.dataList[1][0])/(self.dataList[2][1]-self.dataList[1][1])
        except ZeroDivisionError:
            kNext = (self.dataList[2][0]-self.dataList[1][0])/(self.dataList[2][1]-self.dataList[1][1]+0.00001)

        i = 3
        done = False
        if kStart < kNext:
            while i < len(self.dataList):
                try:
                    kNext = (self.dataList[i][0]-self.dataList[i-1][0])/(self.dataList[i][1]-self.dataList[i-1][1])
                    if kNext < kStart:
                        done = True
                        break

                except ZeroDivisionError:
                    pass
                i+=1
        else:
            while i < len(self.dataList):
                try:
                    kNext = (self.dataList[i][0]-self.dataList[i-1][0])/(self.dataList[i][1]-self.dataList[i-1][1])
                    if kStart < kNext:
                        done = True
                        break

                except ZeroDivisionError:
                    pass
                i+=1
        if done:
            return 111699 * math.sqrt((self.dataList[i][0] - self.dataList[0][0])**2 + (self.dataList[i][1] - self.dataList[0][1])**2)
        else:
            return 0

    def getPower(self):
        try:
            p = self.powersum/(len(self.dataList)-1)
        except ZeroDivisionError:
            p = 0
        return p

    def getClimb(self):
        return self.top-self.enter

    def getNumberOfDataPoints(self):
        return len(self.dataList)
