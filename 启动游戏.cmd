@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if not errorlevel 1 (
  set "MOSHAN_NODE=node.exe"
) else (
  set "MOSHAN_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)
if not exist "%~dp0dist\client\index.html" if not exist "%~dp0dist\index.html" (
  echo Game files are missing. Please keep the dist folder beside this launcher.
  pause
  exit /b 1
)
if "%MOSHAN_NODE%"=="node.exe" goto run
if not exist "%MOSHAN_NODE%" (
  echo Node.js was not found. Please install Node.js 22.13 or newer and try again.
  pause
  exit /b 1
)
:run
"%MOSHAN_NODE%" "%~dp0local-server.mjs"
if errorlevel 1 pause
endlocal
