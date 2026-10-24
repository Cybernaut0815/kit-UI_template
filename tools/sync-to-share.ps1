# Mirrors the repo working tree to the ES project share so people without
# GitHub access always see the latest state. Called by .githooks/post-commit
# and .githooks/post-merge (enable once per clone with:
#   git config core.hooksPath .githooks
# ). Safe to run by hand at any time.
#
# NOTE: /MIR deletes files on the share that are not in the repo - do not
# store hand-placed files inside the destination folder.

$src = Split-Path $PSScriptRoot -Parent
$dst = '\\zaha-hadid.com\Data\Projects\3377_EnvironmentalSustain\1_Projects\zha-ui'

# Hard fail: /MIR from an unbuilt clone would mirror-DELETE the CSS off the
# share and break every example page, including the hub.
if (-not (Test-Path (Join-Path $src 'packages\css\dist\index.css'))) {
    Write-Error 'sync-to-share: packages/css/dist is missing (dist/ is gitignored) - run `pnpm build` first. Sync aborted.'
    exit 1
}

# ponytail: synchronous copy; incremental robocopy is fast. Background it with
# Start-Process if commit latency ever becomes annoying.
robocopy $src $dst /MIR /MT:16 /R:1 /W:1 /NP /NFL /NDL `
    /XD .git node_modules .turbo .claude .superpowers .vscode verify-shots .local-pack `
    /XF *.log

# robocopy exit codes 0-7 mean success
if ($LASTEXITCODE -ge 8) {
    Write-Error "sync-to-share: robocopy failed with exit code $LASTEXITCODE"
    exit 1
}
Write-Host "zha-ui synced to $dst"
exit 0
