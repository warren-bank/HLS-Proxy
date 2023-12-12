@echo off

set NODE_SKIP_PLATFORM_CHECK=1
set NODE_HOME=C:\PortableApps\node.js\10.14.2
set PATH=%NODE_HOME%;%PATH%

call "%~dp0..\..\..\..\.recipes\00. generic use cases\%~nx0"
