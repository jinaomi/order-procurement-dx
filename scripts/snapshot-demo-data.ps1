# Overwrites the golden demo-data snapshot with the CaseMngmt database's
# current state. Run this once you've set up demo data exactly the way you
# want future demo runs to start from, then use reset-demo-data.ps1 anytime
# afterward to undo whatever a demo walkthrough changed.
#
# Usage: powershell -File scripts\snapshot-demo-data.ps1

param(
    [string]$SqlInstance = ".",
    [string]$Database = "CaseMngmt",
    [string]$BackupPath = "C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Backup\CaseMngmt_DemoBaseline.bak"
)

sqlcmd -S $SqlInstance -C -Q "BACKUP DATABASE [$Database] TO DISK = N'$BackupPath' WITH INIT, NAME = N'CaseMngmt-DemoBaseline', DESCRIPTION = N'Golden demo snapshot, updated $(Get-Date -Format yyyy-MM-dd)';"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Backup failed — see sqlcmd output above."
    exit 1
}

Write-Host "Golden snapshot updated at $BackupPath."
