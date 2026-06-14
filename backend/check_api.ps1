$body = '{"loginId":"admin","password":"admin123"}'
try {
  $r = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method POST -ContentType 'application/json' -Body $body
  Write-Host "LOGIN: OK"
  $h = @{Authorization="Bearer $($r.token)"}

  $so = Invoke-RestMethod -Uri 'http://localhost:8080/api/sales-orders' -Headers $h
  Write-Host "SalesOrders: $($so.Count) -- $(($so | ForEach-Object { $_.ref }) -join ', ')"

  $po = Invoke-RestMethod -Uri 'http://localhost:8080/api/purchase-orders' -Headers $h
  Write-Host "PurchaseOrders: $($po.Count) -- $(($po | ForEach-Object { $_.ref }) -join ', ')"

  $mo = Invoke-RestMethod -Uri 'http://localhost:8080/api/manufacturing-orders' -Headers $h
  Write-Host "ManufacturingOrders: $($mo.Count) -- $(($mo | ForEach-Object { $_.ref }) -join ', ')"

  $prod = Invoke-RestMethod -Uri 'http://localhost:8080/api/products' -Headers $h
  Write-Host "Products: $($prod.Count)"

  $vend = Invoke-RestMethod -Uri 'http://localhost:8080/api/vendors' -Headers $h
  Write-Host "Vendors: $($vend.Count) -- $(($vend | ForEach-Object { $_.name }) -join ', ')"

  $cust = Invoke-RestMethod -Uri 'http://localhost:8080/api/customers' -Headers $h
  Write-Host "Customers: $($cust.Count) -- $(($cust | ForEach-Object { $_.name }) -join ', ')"

  try {
    $sa = Invoke-RestMethod -Uri 'http://localhost:8080/api/analytics/shortage-alerts' -Headers $h
    Write-Host "ShortageAlerts: $($sa.Count)"
    foreach ($a in $sa) { Write-Host "  -> MO=$($a.moRef) Component=$($a.componentName) Severity=$($a.severity) Shortage=$($a.shortageQuantity)" }
  } catch {
    Write-Host "ShortageAlerts ERROR: $($_.Exception.Message)"
  }
} catch {
  Write-Host "FATAL ERROR: $($_.Exception.Message)"
}
