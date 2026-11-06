@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "NM=%~dp0node_modules"
if not exist "%NM%\esbuild\package.json" (
  echo MISSING node_modules at %NM%
  exit /b 1
)
if exist dist rmdir /s /q dist
mkdir dist\photos
copy /Y public\photos\*.webp dist\photos\ >nul
copy /Y index.html dist\ >nul
if exist public\favicon.svg copy /Y public\favicon.svg dist\ >nul
type nul > dist\.nojekyll
set "NODE_PATH=%NM%"
call "%NM%\.bin\esbuild.cmd" src/main.tsx --bundle --minify --format=iife --loader:.css=empty --define:process.env.NODE_ENV=\"production\" --outfile=dist/app.js --resolve-extensions=.tsx,.ts,.js,.json --alias:react="%NM%/react" --alias:react-dom="%NM%/react-dom" --alias:lucide-react="%NM%/lucide-react"
if errorlevel 1 (
  echo ESBUILD_FAILED
  exit /b 1
)
call "%NM%\.bin\tailwindcss.cmd" -c tailwind.config.js -i src/styles.css -o dist/app.css --minify
if errorlevel 1 (
  echo TAILWIND_FAILED
  exit /b 1
)
if not exist dist\app.css (
  echo MISSING_APP_CSS
  exit /b 1
)
echo BUILD_OK
exit /b 0
