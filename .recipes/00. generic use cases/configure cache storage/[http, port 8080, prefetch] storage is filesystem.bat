@echo off

set cache_storage_dir="%~dp0.\cache_storage"

set hlsd_opts=%hlsd_opts% --cache-storage "filesystem" --cache-storage-fs-dirpath %cache_storage_dir%

if exist %cache_storage_dir% rm -rf %cache_storage_dir%
mkdir %cache_storage_dir%

call "%~dp0..\[http, port 8080] prefetch.bat"
