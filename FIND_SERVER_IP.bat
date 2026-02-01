@echo off
echo === Wo finde ich die Server-IP? ===
echo.

echo METHODEN ZUR IP-BESTIMMUNG:
echo =========================

echo 1. LOKALER SERVER (selbes Netzwerk):
echo    Deine IP: 10.8.11.141
echo    Server-IP: Gleiche Netzwerkklasse suchen
echo    Befehl: ping -a SERVER_NAME

echo.
echo 2. CLOUD SERVER (AWS, Azure, Google Cloud):
echo    AWS EC2: EC2 Dashboard ^> Instances ^> Public IP
echo    Azure: Virtual Machines ^> Overview ^> Public IP
echo    Google Cloud: Compute Engine ^> VM instances ^> External IP

echo.
echo 3. DEDIZIERTER SERVER:
echo    Provider Dashboard (Hetzner, Strato etc.)
echo    Server Management ^> Network ^> IP Address
echo    Rechnung/Vertragsunterlagen

echo.
echo 4. VPS/HOSTING:
echo    cPanel/Plesk: Server Information
echo    SSH Login: hostname -I oder curl ifconfig.me
echo    Support kontaktieren

echo.
echo 5. NETZWERKSCANNER:
echo    Advanced IP Scanner
echo    Angry IP Scanner
echo    nmap 10.8.11.0/24

echo.
echo HÄUFIGE IP-BEREICHE:
echo ===================
echo Lokal: 192.168.x.x oder 10.x.x.x
echo Server: Oft im gleichen Subnetz
echo Extern: Von Provider zugewiesen

echo.
echo DEBUG BEFEHLE:
echo ==============
echo Windows: ipconfig /all
echo Linux: hostname -I
echo Router: http://192.168.1.1
echo DNS: nslookup DOMAIN

pause