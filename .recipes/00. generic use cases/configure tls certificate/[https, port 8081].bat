@echo off

set hlsd_opts=%hlsd_opts% --tls-cert "%~dp0.\cert\cert.pem"
set hlsd_opts=%hlsd_opts% --tls-key  "%~dp0.\cert\key.pem"
set hlsd_opts=%hlsd_opts% --tls-pass "%~dp0.\cert\pass.phrase"

call "%~dp0..\%~nx0"
