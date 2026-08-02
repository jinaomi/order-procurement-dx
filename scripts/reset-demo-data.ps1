# Resets the CaseMngmt database back to the golden demo-data snapshot,
# undoing anything a demo walkthrough changed (invoice payments, stock
# quantities, goods receipts, order statuses, etc.) without having to
# hand-write undo logic for each mutation.
#
# Usage: powershell -File scripts\reset-demo-data.ps1
# Re-run scripts\snapshot-demo-data.ps1 first if you want to update the baseline.

param(
    [string]$SqlInstance = ".",
    [string]$Database = "CaseMngmt",
    [string]$BackupPath = "C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Backup\CaseMngmt_DemoBaseline.bak"
)

# Note: don't Test-Path $BackupPath here — the SQL Server default backup
# folder's ACL only grants the SQL Server service account + Administrators
# access, so an unprivileged shell can get "Access is denied" on a file that
# the engine itself (running RESTORE below) can read just fine. Let sqlcmd's
# own exit code be the source of truth instead.

Write-Host "Stopping backend process (CaseMngmt.Server) if running..."
Get-Process -Name "CaseMngmt.Server" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Restoring $Database from golden snapshot ($BackupPath)..."
sqlcmd -S $SqlInstance -C -Q "ALTER DATABASE [$Database] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE [$Database] FROM DISK = N'$BackupPath' WITH REPLACE; ALTER DATABASE [$Database] SET MULTI_USER;"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Restore failed — see sqlcmd output above."
    exit 1
}

Write-Host ""
Write-Host "Demo data reset to golden snapshot."
Write-Host "Restart the backend manually (ASPNETCORE_ENVIRONMENT must be Development):"
Write-Host '  cd backend\CaseMngmt.Server'
Write-Host '  $env:ASPNETCORE_ENVIRONMENT="Development"; dotnet run --no-launch-profile'
