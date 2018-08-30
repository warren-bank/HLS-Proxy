@echo off

rem :: --------------------------------------------------------------------------
rem :: https://nodejs.org/en/docs/guides/debugging-getting-started/
rem :: --------------------------------------------------------------------------
rem :: use Chromium browser to attach to debugger with DevTools:
rem ::     chrome://inspect
rem :: --------------------------------------------------------------------------

set hlsd_node_opts=%hlsd_node_opts% --inspect-brk="127.0.0.1:9229"

call "%~dp0..\[http, port 8080] prefetch.bat"
