import httplib
import json
from StringIO import StringIO
import math
import sched, time

s = sched.scheduler(time.time, time.sleep)

bridgeport = "10.0.0.144:8080"

def getLightStates(storedLightStates, initialCheck=False):
    connection = httplib.HTTPConnection(bridgeport)

    connection.request("GET", "/api/newdeveloper/lights")
    response = connection.getresponse()
    stringBody = StringIO(response.read())
    allLights = json.load(stringBody)

    unformattedLights = []

    for light in allLights.keys():
        path = "/api/newdeveloper/lights/" + light
        connection.request("GET", path)
        res = connection.getresponse()
        body = StringIO(res.read())
        singleLight = json.load(body)
        singleLight["id"] = light
        unformattedLights.append(singleLight)

    currentLightStates = []
    for light in unformattedLights:
        lightDict = {}
        lightDict["name"] = light["name"]
        lightDict["id"] = light["id"]
        lightDict["on"] = light["state"]["on"]
        unscaledBrightness = light["state"]["bri"]
        scaledBrightness = int((unscaledBrightness * 100)/254)
        lightDict["brightness"] = scaledBrightness
        currentLightStates.append(lightDict)

    if (initialCheck):
        print currentLightStates

    else:
        for i in xrange(len(currentLightStates)):
            curId = currentLightStates[i]["id"]
            onState = currentLightStates[i]["on"]
            briState = currentLightStates[i]["brightness"]
            if  onState != storedLightStates[i]["on"]:
                changes = {"id":curId, "on":onState}
                print changes
            if briState != storedLightStates[i]["brightness"]:
                changes = {"id":curId, "brightness":briState}
                print changes

    s.enter(0.5, 1, getLightStates, (currentLightStates, False))
    s.run()


getLightStates([], True)
