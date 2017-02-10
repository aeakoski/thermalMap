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
        if self.top < int(dataPoint[2]):
            self.top = int(dataPoint[2])

        if self.enter == 0:
            self.enter = int(dataPoint[2])
        else:
            pTemp = (float(dataPoint[2])/float(dataPoint[3]))
            if 0 < pTemp:
                self.powersum+=(float(dataPoint[2])/float(dataPoint[3]))
        self.dataList.append(dataPoint)


    def getGroundCenter(self):
        #Calculate GC
        pass
        
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
