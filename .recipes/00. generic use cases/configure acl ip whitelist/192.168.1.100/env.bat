@echo off

set cd0=%cd%

cd /D "%~dp0."
set cd1=%cd%

cd ..
set cd2=%cd%

call set dirname=%%cd1:%cd2%\=%%

cd /D "%cd0%"
set cd0=
set cd1=
set cd2=
