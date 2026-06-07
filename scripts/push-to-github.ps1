param(
    [string]$Remote = "origin",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$LogFile = Join-Path $RepoRoot ".git\auto-sync.log"

function Write-Log {
    param([string]$Message)
    $Line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ssK"), $Message
    Write-Host $Line
    Add-Content -Path $LogFile -Value $Line
}

Set-Location $RepoRoot

if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is not available in PATH."
}

if (!(Test-Path ".git")) {
    throw "This script must run inside an existing Git repository."
}

git config user.name "mayed050" | Out-Null
git config user.email "mayed050@users.noreply.github.com" | Out-Null

Write-Log "Starting GitHub auto-sync."

git fetch $Remote $Branch | Out-Null

$CurrentBranch = (git branch --show-current).Trim()
if ($CurrentBranch -ne $Branch) {
    throw "Current branch is '$CurrentBranch', expected '$Branch'."
}

$ChangedFiles = git status --porcelain
if ($ChangedFiles) {
    Write-Log "Local changes detected. Creating sync commit."
    git add -A
    $CommitMessage = "chore: auto-sync local project files $(Get-Date -Format 'yyyy-MM-dd HH:mm') [skip ci]"
    git commit -m $CommitMessage | Out-Null
} else {
    Write-Log "No local file changes detected."
}

Write-Log "Rebasing on $Remote/$Branch."
git pull --rebase $Remote $Branch | Out-Null

$AheadBehind = git rev-list --left-right --count "$Remote/$Branch...HEAD"
$Ahead = [int](($AheadBehind -split "\s+")[1])

if ($Ahead -gt 0) {
    Write-Log "Pushing $Ahead commit(s) to GitHub."
    git push $Remote $Branch | Out-Null
} else {
    Write-Log "Nothing to push."
}

Write-Log "GitHub auto-sync completed."
