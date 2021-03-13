@echo off

set chrome="C:\PortableApps\SRWare Iron\67.0.3500.0\IronPortable.exe"
if not exist %chrome% set chrome=chrome

set dashboard_url="http://localhost:4040"

start "dashboard" %chrome% %dashboard_url%
