# Reflow Report page: place Location and Map side-by-side, then Media Upload after
$ErrorActionPreference = 'Stop'

$file = "c:\Users\anura\Downloads\Demo2\Demo2\CrisisConnect\frontend\app\(main)\report\page.tsx"
if (-not (Test-Path $file)) { throw "File not found: $file" }

$content = Get-Content -Raw -Path $file

# Regex patterns to capture entire motion.div blocks by their heading comments
$rxLoc  = [regex]"(?s)\{\/\*\s*Location\s*\*\/\}[\s\S]*?<\/motion\.div>\s*"
$rxMed  = [regex]"(?s)\{\/\*\s*Media\s+Upload\s*\*\/\}[\s\S]*?<\/motion\.div>\s*"
$rxMap  = [regex]"(?s)\{\/\*\s*Location\s+Selector\s+Map\s*\*\/\}[\s\S]*?<\/motion\.div>\s*"

$locM  = $rxLoc.Match($content)
$medM  = $rxMed.Match($content)
$mapM  = $rxMap.Match($content)

if (-not $locM.Success) { throw "Could not find the 'Location' block." }
if (-not $mapM.Success) { throw "Could not find the 'Location Selector Map' block." }
if (-not $medM.Success) { throw "Could not find the 'Media Upload' block." }

$locationBlock = $locM.Value.TrimEnd()
$mediaBlock    = $medM.Value.TrimEnd()
$mapBlock      = $mapM.Value.TrimEnd()

# Build combined grid wrapper with the two original blocks as columns
$combined = @"
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
  $locationBlock
  $mapBlock
</div>
"@

# 1) Replace the Location block with a placeholder
$content = $content.Remove($locM.Index, $locM.Length)
$content = $content.Insert($locM.Index, "__COMBINED_PLACEHOLDER__")

# 2) Remove first occurrence of Map block (since it will be inside combined)
$content = $rxMap.Replace($content, "", 1)

# 3) Remove first occurrence of Media block (we will re-insert after combined)
$content = $rxMed.Replace($content, "", 1)

# 4) Expand placeholder into combined + media (media after combined)
$content = $content -replace "__COMBINED_PLACEHOLDER__", ($combined + "`n" + $mediaBlock)

Set-Content -Path $file -Value $content -NoNewline
Write-Host "Report page reflowed: Location + Map side-by-side, Media Upload moved after them." -ForegroundColor Green
