# -*- coding: utf-8 -*-

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
        if self.enter == 0:
            self.enter = int(dataPoint[2])
        if self.top < int(dataPoint[2]):
            self.top = int(dataPoint[2])

        self.dataList.append(dataPoint)
        self.powersum+=(float(dataPoint[2])/float(dataPoint[3]))

    def getGroundCenter(self):
        #Calculate GC
        pass
    def getPower(self):
        return self.powersum/len(self.dataList)

    def getClimb(self):
        return self.top-self.enter

    def getNumberOfDataPoints(self):
        return len(self.dataList)
