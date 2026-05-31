# Sync script for pushing changes to your GitHub repository
# Automatically changes location to the project root directory
$RepoUrl = "https://github.com/mayed050/emirati-capital-dashboard.git"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (![string]::IsNullOrEmpty($ScriptDir)) {
    Set-Location (Split-Path -Parent $ScriptDir)
}

Write-Host "=== Start Syncing Changes to GitHub ===" -ForegroundColor Cyan

# Check if Git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[-] Git is not found in your environment PATH." -ForegroundColor Red
    Write-Host "[!] Please install Git or ensure it is added to your PATH variables." -ForegroundColor Yellow
    exit 1
}

# Initialize local git repository if not done
if (!(Test-Path .git)) {
    Write-Host "[*] Initializing local Git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Ensure Git user config exists for this repository
$GitUser = git config user.name
$GitEmail = git config user.email
if ([string]::IsNullOrEmpty($GitUser)) {
    Write-Host "[*] Configuring local Git user name..." -ForegroundColor Yellow
    git config user.name "mayed050"
}
if ([string]::IsNullOrEmpty($GitEmail)) {
    Write-Host "[*] Configuring local Git user email..." -ForegroundColor Yellow
    git config user.email "mayed050@users.noreply.github.com"
}

# Check and set git remote
$RemoteCheck = git remote get-url origin 2>$null
if ([string]::IsNullOrEmpty($RemoteCheck)) {
    Write-Host "[*] Linking local repository to GitHub..." -ForegroundColor Yellow
    git remote add origin $RepoUrl
} else {
    git remote set-url origin $RepoUrl
}

# Stage all files
Write-Host "[*] Staging files..." -ForegroundColor Yellow
git add .

# Create Commit
$CommitMessage = "feat: implement live price ticking and flashing animations"
Write-Host "[*] Committing changes: '$CommitMessage'..." -ForegroundColor Yellow
git commit -m $CommitMessage

# Force push to main
Write-Host "[>] Pushing changes to GitHub (it may ask you to authenticate in a separate window)..." -ForegroundColor Green
git push -f -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] SUCCESS: Changes synced successfully! Your updates are live." -ForegroundColor Green
} else {
    Write-Host "[-] ERROR: Failed to push to GitHub. Please check your credentials or access rights." -ForegroundColor Red
}
