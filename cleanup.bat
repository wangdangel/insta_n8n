@echo off
echo Stopping and removing containers...
docker-compose down

echo Do you want to remove volumes as well? This will delete all data. (y/n)
set /p response=
if /i "%response%"=="y" (
  echo Removing volumes...
  docker-compose down -v
  echo Volumes removed.
) else (
  echo Volumes preserved.
)

echo Cleanup complete!
pause
