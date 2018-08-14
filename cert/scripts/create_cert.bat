@echo off

set openssl_HOME=C:\PortableApps\OpenSSL\1.1.0
set PATH=%openssl_HOME%;%PATH%

cd /D "%~dp0.."

if exist "key.pem"  del "key.pem"
if exist "cert.pem" del "cert.pem"

openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 36500 -config "%openssl_HOME%\openssl.cnf"

echo.
pause
