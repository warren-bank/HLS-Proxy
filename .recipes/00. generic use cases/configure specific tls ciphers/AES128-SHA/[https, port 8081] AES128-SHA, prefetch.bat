@echo off

rem :: --------------------------------------------------------------------------
rem :: https://nodejs.org/api/tls.html#tls_modifying_the_default_tls_cipher_suite
rem :: --------------------------------------------------------------------------
rem :: this setting is a workaround for the error:
rem ::     "ssl3_check_cert_and_algorithm:dh key too small"
rem ::
rem :: this error occurs when downloading video files (.m3u8, .ts)
rem :: from an HTTPS server that uses encryption so weak
rem :: that it is no-longer supported when using the default tls cipher suite
rem :: --------------------------------------------------------------------------

set hlsd_opts=%hlsd_opts% --req-secure-ciphers "AES128-SHA"

call "%~dp0..\..\[https, port 8081] prefetch.bat"
