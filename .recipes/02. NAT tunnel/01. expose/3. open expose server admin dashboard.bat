@echo off

set chrome="C:\PortableApps\SRWare Iron\67.0.3500.0\IronPortable.exe"
if not exist %chrome% set chrome=chrome

set dashboard_url="http://username:password@expose.my-domain:9090"

start "dashboard" %chrome% %dashboard_url%
