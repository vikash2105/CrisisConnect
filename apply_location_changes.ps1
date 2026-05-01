# PowerShell script to apply location improvements to Report page

$filePath = "c:\Users\anura\Downloads\Demo2\Demo2\CrisisConnect\frontend\app\(main)\report\page.tsx"

# Read the file
$content = Get-Content -Path $filePath -Raw

# Change 1: Add debounced geocoding effect after handleLocationSelect
$pattern1 = "  const handleLocationSelect = \(lat: number, lng: number, address: string\) => \{\s+setSelectedLocation\(\{ lat, lng, address \}\);\s+setFormData\(prev => \(\{ \.\.\.prev, address, coordinates: \[lng, lat\] \}\)\);\s+\};"

$replacement1 = @"
  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setSelectedLocation({ lat, lng, address });
    setFormData(prev => ({ ...prev, address, coordinates: [lng, lat] }));
  };

  // Debounced forward geocoding when the user types an address
  useEffect(() => {
    const q = formData.address?.trim();
    if (!q) return;

    const timer = setTimeout(async () => {
      try {
        const geocodeUrl = ``https://nominatim.openstreetmap.org/search?format=json&q=`${encodeURIComponent(q)}&limit=1``;
        const res = await fetch(geocodeUrl, { headers: { 'User-Agent': 'CrisisConnect App' } });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const { lat, lon, display_name } = data[0];
          const latNum = parseFloat(lat);
          const lonNum = parseFloat(lon);
          setSelectedLocation({ lat: latNum, lng: lonNum, address: display_name || q });
          setFormData(prev => ({ ...prev, coordinates: [lonNum, latNum] }));
        }
      } catch {
        // ignore; user can still click on the map
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.address]);
"@

$content = $content -replace $pattern1, $replacement1

# Save the file
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Changes applied successfully!" -ForegroundColor Green
Write-Host "Please manually complete the remaining changes by following the instructions provided earlier." -ForegroundColor Yellow
