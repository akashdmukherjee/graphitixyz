#!/bin/bash
kill -9 $(lsof -t -i:9000)
cd server/
meteor -p 9000&
cd ../client
node server.js
