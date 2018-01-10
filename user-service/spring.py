#! /usr/bin/python

import os
print "Kill service running on :8080"
os.system("kill $(lsof -t -i:8080)")
print "Restart mvn spring-boot:run"
os.system("mvn spring-boot:run & tail -f logs/server.log")