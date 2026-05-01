# Apply: typed address reflects on map (report page)
$ErrorActionPreference = 'Stop'

$file = "c:\Users\anura\Downloads\Demo2\Demo2\CrisisConnect\frontend\app\(main)\report\page.tsx"
if (-not (Test-Path $file)) { throw "File not found: $file" }

$content = Get-Content -Raw -Path $file

# 1) Insert debounced geocoding effect after handleLocationSelect() if missing
$effectSnippet = @'

  // Debounced geocoding when user types an address to reflect on the map
  useEffect(() => {
    const addr = formData.address?.trim();
    if (!addr) return;

    const handle = setTimeout(async () => {
      try {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`;
        const res = await fetch(geocodeUrl, { headers: { 'User-Agent': 'CrisisConnect App' } });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const display = data[0].display_name || addr;
          setSelectedLocation({ lat, lng, address: display });
          setFormData(prev => ({ ...prev, coordinates: [lng, lat] }));
        }
      } catch {
        # ignore errors; user can still select via map
      }
    }, 600);

    return () => clearTimeout(handle);
  }, [formData.address]);
'@

if (-not ($content -like "*useEffect(() => {*formData.address*")) {
  $rxHandle = [regex]'const handleLocationSelect\s*\([^\)]*\)\s*=>\s*\{[\s\S]*?\};'
  $m = $rxHandle.Match($content)
  if ($m.Success) {
    $insertPos = $m.Index + $m.Length
    $content = $content.Substring(0, $insertPos) + $effectSnippet + $content.Substring($insertPos)
  } else {
    throw "Could not find handleLocationSelect function to insert geocoding effect."
  }
}

# 2) Ensure <LocationSelectorMap ... position=... /> prop present
$rxComp = [regex]'(<LocationSelectorMap\b[^>]*)(/>)'
$content = $rxComp.Replace($content, {
  param($m)
  $pre = $m.Groups[1].Value
  $close = $m.Groups[2].Value
  if ($pre -match 'position=') { return $m.Value }
  else { return ($pre + ' position={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null} ' + $close) }
}, 1)

Set-Content -Path $file -Value $content -NoNewline
Write-Host "Applied geocoding effect and position prop to report page." -ForegroundColor Green
