# Auto-update report page to reflect typed address on the map
$ErrorActionPreference = 'Stop'

$file = "c:\Users\anura\Downloads\Demo2\Demo2\CrisisConnect\frontend\app\(main)\report\page.tsx"
if (-not (Test-Path $file)) { throw "File not found: $file" }

$content = Get-Content -Raw -Path $file

# 1) Insert debounced geocoding effect after handleLocationSelect definition
$handleBlock = @"
const handleLocationSelect = (lat: number, lng: number, address: string) => {
  setSelectedLocation({ lat, lng, address });
  setFormData(prev => ({ ...prev, address, coordinates: [lng, lat] }));
};
"@

if ($content.Contains($handleBlock)) {
  $effect = @"

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
"@
  if (-not $content.Contains($effect.Trim())) {
    $content = $content.Replace($handleBlock, $handleBlock + $effect)
  }
} else {
  throw "Could not locate handleLocationSelect block to insert debounced geocoding."
}

# 2) Update LocationSelectorMap usage to pass position prop
# Match the component usage block and add position prop if missing
$mapUsagePattern = [regex]"<LocationSelectorMap\s*\n\s*onLocationSelect=\{handleLocationSelect\}\s*\n\s*/>"
  $replacement = @"
<LocationSelectorMap
  onLocationSelect={handleLocationSelect}
  position={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null}
/>
"@
  $content = $mapUsagePattern.Replace($content, $replacement.TrimEnd(), 1)
}
else {
  # Try a more generic single-line self-closing usage
  $mapUsagePattern2 = [regex]"<LocationSelectorMap[^>]*/>"
{{ ... }}
    $content = $mapUsagePattern2.Replace($content, '<LocationSelectorMap onLocationSelect={handleLocationSelect} position={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null} />', 1)
  }
}

Set-Content -Path $file -Value $content -NoNewline
Write-Host "Updated report page: typed address now controls map marker and center." -ForegroundColor Green
