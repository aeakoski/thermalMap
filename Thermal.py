# -*- coding: utf-8 -*-
import math

class Thermal(object):
    """docstring for Thermal."""
    def __init__(self):
        self.dataList = []
        self.power = 0
        self.groundCenter = (0, 0)
        self.diameter = 0
        self.speed = 0
        self.powersum = 0
        self.top = 0
        self.enter = 0

        self.xList=[]
        self.yList=[]
        self.altList=[]


    def setDiameterAndSpeed(self):
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
            self.diameter = 111699 * math.sqrt((self.dataList[i][0] - self.dataList[0][0])**2 + (self.dataList[i][1] - self.dataList[0][1])**2)
        else:
            self.diameter = 0

        distance = self.diameter * 3.1415 / 2

        j=1
        time = 1 # Är 1 för att förhindra ZeroDivisionError, ger inte så stort fel i slutändan
        while j != i:
            time += self.dataList[j][3]
            j+=1

        self.speed = distance / time

    def calculateData(self):
        self.setDiameterAndSpeed()

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
        self.xList.append(float(dataPoint[0]))
        self.yList.append(float(dataPoint[1]))
        self.altList.append(int(dataPoint[2]))

    def getGroundCenter(self):
        xs = self.xList
        ys = self.yList

        if len(xs)<3 or len(ys)<3:
            print(len(xs),len(ys), self.getNumberOfDataPoints())
            raise ValueError('Can not calculate circle from this few points!')
        sigmaX = 0
        sigmaY = 0
        q = 0

        n = len(xs)

        i = 1
        while i < n-2:
            j = i+1
            while j < n-1:
                k = j+1
                while k < n:
                    delta = (xs[k]-xs[j])*(ys[i]-ys[i])-(xs[j]-xs[i])*(ys[k]-ys[j])

                    if abs(delta) > 0:
                        xc =  ((ys[k]-ys[j])*(xs[i]**2+ys[i]**2)+(ys[i]-ys[k])*(xs[j]**2+ys[j]**2)+(ys[j]-ys[i])*(xs[k]**2+ys[k]**2))/2*delta
                        yc = -((xs[k]-xs[j])*(xs[i]**2+ys[i]**2)+(xs[i]-xs[k])*(xs[j]**2+ys[j]**2)+(xs[j]-xs[i])*(xs[k]**2+ys[k]**2))/2*delta
                        sigmaX += xc
                        sigmaY += yc
                        q += 1

                    else:
                        pass
                        #print(i,n)
                    k+=1
                j+=1
            i+=1
        if q==0:
            
            return 0,0
            #raise ValueError('Kunde inte aproximera cirkel. Alla punkterna låg på en rad!')

        return sigmaX/q, sigmaY/q


    def getPlotData(self):
        return self.xList, self.yList, self.altList

    def getDiameter(self):
        return self.diameter

    def getSpeed(self):
        return self.speed

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
