Start-Sleep -Seconds 40
try {
  $r = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"loginId":"admin","password":"admin123"}'
  Write-Host "LOGIN OK"
  $h = @{Authorization="Bearer $($r.token)"}
  $ds = Invoke-RestMethod -Uri 'http://localhost:8080/api/analytics/dead-stock' -Headers $h
  Write-Host "Dead Stock count: $($ds.Count)"
  if ($ds.Count -gt 0) {
    $first = $ds[0]
    Write-Host "First item: $($first.productName) - inventoryValue type: $($first.inventoryValue.GetType().Name) - value: $($first.inventoryValue)"
    $total = ($ds | ForEach-Object { $_.inventoryValue } | Measure-Object -Sum).Sum
    Write-Host "Total locked: $total"
  }
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
}
