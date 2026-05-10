# Replace the Upload Photo section with the Select Location on Map section in report page
$ErrorActionPreference = 'Stop'

$file = "c:\Users\anura\Downloads\Demo2\Demo2\CrisisConnect\frontend\app\(main)\report\page.tsx"
$content = Get-Content -Raw -Path $file

# Regex patterns for the two blocks
$mediaPattern = [regex]"(?s)\{\/\*\s*Media\s+Upload\s*\*\/\}[\s\S]*?<\/motion\.div>\s*"
$mapPattern   = [regex]"(?s)\{\/\*\s*Location\s+Selector\s+Map\s*\*\/\}[\s\S]*?<\/motion\.div>\s*"

$mapMatch = $mapPattern.Match($content)
if (-not $mapMatch.Success) {
  throw "Could not find the 'Location Selector Map' block. Aborting to avoid corrupting the file."
}

$mediaMatch = $mediaPattern.Match($content)
if (-not $mediaMatch.Success) {
  throw "Could not find the 'Media Upload' block. Aborting to avoid corrupting the file."
}

# 1) Replace the Media Upload block with the Map block
$content = $mediaPattern.Replace($content, $mapMatch.Value, 1)

# 2) Remove the original Map block (first occurrence)
$content = $mapPattern.Replace($content, "", 1)

Set-Content -Path $file -Value $content -NoNewline
Write-Host "Replaced 'Upload Photo' with 'Select Location on Map' successfully." -ForegroundColor Green
