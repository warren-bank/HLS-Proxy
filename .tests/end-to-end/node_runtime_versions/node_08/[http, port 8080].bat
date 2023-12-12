@echo off

set NODE_SKIP_PLATFORM_CHECK=1
set NODE_HOME=C:\PortableApps\node.js\08.17.0
set PATH=%NODE_HOME%;%PATH%

call "%~dp0..\..\..\..\.recipes\00. generic use cases\%~nx0"
