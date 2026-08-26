# Skrypt PowerShell do budowania instalatora Windows (.EXE)
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "  GENERATOR INSTALATORA WINDOWS (.EXE) - Cennik Lamp Samochodowych" -ForegroundColor Cyan
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Sprawdzenie Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[BLAD KRYTYCZNY] Nie wykryto srodowiska Node.js!" -ForegroundColor Red
    Write-Host "Pobierz i zainstaluj Node.js (wersja LTS) ze strony: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Nacisnij ENTER, aby zakonczyc..."
    exit 1
}

# 2. Sprawdzenie zaleznosci
if (-not (Test-Path "node_modules")) {
    Write-Host "[KROK 1/3] Pobieranie bibliotek (npm install)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[BLAD] Nie udalo sie pobrac bibliotek." -ForegroundColor Red
        Read-Host "Nacisnij ENTER, aby zakonczyc..."
        exit $LASTEXITCODE
    }
} else {
    Write-Host "[KROK 1/3] Biblioteki sa juz zainstalowane." -ForegroundColor Green
}

# 3. Kompilacja Vite
Write-Host ""
Write-Host "[KROK 2/3] Kompilacja kodu aplikacji (npm run build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[BLAD] Problem podczas kompilacji aplikacji." -ForegroundColor Red
    Read-Host "Nacisnij ENTER, aby zakonczyc..."
    exit $LASTEXITCODE
}

# 4. Generowanie instalatora .EXE
Write-Host ""
Write-Host "[KROK 3/3] Generowanie instalatora Windows .EXE (electron-builder)..." -ForegroundColor Yellow
npx electron-builder --win nsis --x64
if ($LASTEXITCODE -ne 0) {
    Write-Host "[BLAD] Nie udalo sie wygenerowac instalatora .EXE." -ForegroundColor Red
    Read-Host "Nacisnij ENTER, aby zakonczyc..."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor Green
Write-Host "  SUKCES! Gotowy instalator znajduje sie w folderze \release:" -ForegroundColor Green
Write-Host "  release\Cennik-Lamp-Samochodowych-Instalator-Windows.exe" -ForegroundColor White
Write-Host "=======================================================================" -ForegroundColor Green
Write-Host ""

if (Test-Path "release") {
    Invoke-Item "release"
}

Read-Host "Nacisnij ENTER, aby zakonczyc..."
