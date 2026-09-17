$ErrorActionPreference = 'Stop'
$p = "D:\1011-main\1011-main\1011-main\messages\es.json"
$t = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
$j = $t | ConvertFrom-Json
$rows = New-Object System.Collections.Generic.List[object]
function Walk($node, $path) {
  if ($node -is [System.Management.Automation.PSCustomObject]) {
    foreach ($prop in $node.PSObject.Properties) { Walk $prop.Value "$path.$($prop.Name)" }
  } elseif ($node -is [System.Collections.IList]) {
    for ($i = 0; $i -lt $node.Count; $i++) { Walk $node[$i] "$path[$i]" }
  } else {
    $rows.Add([pscustomobject]@{ Path = $path; Val = [string]$node })
  }
}
Walk $j ''
$sb = New-Object System.Text.StringBuilder
function Scan($label, $pattern) {
  [void]$sb.AppendLine("===== $label =====")
  $m = @($rows | Where-Object { $_.Val -match $pattern })
  [void]$sb.AppendLine("COUNT: " + $m.Count)
  foreach ($x in $m) {
    $v = $x.Val
    if ($v.Length -gt 180) { $v = $v.Substring(0, 180) + '...' }
    [void]$sb.AppendLine("  " + $x.Path + "  =>  " + $v)
  }
  [void]$sb.AppendLine("")
}
Scan 'marca propia' 'marca propia'
Scan 'marca privada' 'marca privada'
Scan 'marca blanca' 'marca blanca'
Scan 'Contactar infinitive' 'Contactar'
Scan 'a nivel de' 'a nivel de'
Scan 'de que' 'de que'
Scan 'hacer una|un' 'hacer una|hacer un'
Scan 'realizar una|un' 'realizar una|realizar un'
Scan 'tomar una|un' 'tomar una|tomar un'
Scan 'con el fin de' 'con el fin de'
Scan 'usted' '\busted\b'
Scan 'USTED forms' 'Cont\u00E1ctenos|Contacte|Suscr\u00EDbase|P\u00F3ngase|Solicite|Encuentre|Personalice|Empiece|Compare|Ampl\u00EDe|Convierta|Seleccione|Configure|Disfrute|Reciba|Obtenga|Descubra'
Scan 'TU forms' 'Contacta|Suscr\u00EDbete|Ponte|Solicita|Encuentra|Descubre|Obt\u00E9n|Personaliza|Empieza|Elige'
Scan 'dispositivo' 'dispositivo'
Scan 'depiladora' 'depiladora'
[System.IO.File]::WriteAllText("D:\1011-main\1011-main\1011-main\messages\work\_es_scan2.txt", $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "DONE"
