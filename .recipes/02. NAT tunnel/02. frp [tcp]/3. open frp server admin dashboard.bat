@echo off

call "%~dp0.\0. env.bat"

set chrome="C:\PortableApps\SRWare Iron\67.0.3500.0\IronPortable.exe"
if not exist %chrome% set chrome=chrome

set dashboard_url="http://admin:admin@%FRP_SERVER_ADDR%:%FRP_SERVER_DASHBOARD_PORT%"

start "dashboard" %chrome% %dashboard_url%
