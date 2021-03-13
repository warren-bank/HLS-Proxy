@echo off

set PHP_HOME=C:\PortableApps\php\7.4.15
set PATH=%PHP_HOME%;%PATH%

set EXPOSE_PHAR="%~dp0.\expose-1.5.1.phar"

if not exist %EXPOSE_PHAR% (
  wget -O %EXPOSE_PHAR% --no-check-certificate "https://github.com/beyondcode/expose/raw/1.5.1/builds/expose"
)

php.exe %EXPOSE_PHAR% %*
