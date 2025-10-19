@echo off
echo.
echo ==================================
echo  TESTING ELECTRON APP
echo ==================================
echo.
echo Starting app with DevTools...
echo.
echo INSTRUCTIONS:
echo 1. The app window should open
echo 2. DevTools will open automatically  
echo 3. Check the Console tab
echo 4. You should see startup messages
echo.
echo If you see a BLANK PAGE:
echo - Check Console for errors
echo - Look for "Electron API Available: true"
echo - Take a screenshot and report
echo.
pause
echo.

npx electron .

echo.
echo App closed.
pause
