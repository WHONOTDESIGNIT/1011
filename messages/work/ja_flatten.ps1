$ErrorActionPreference = 'Stop'
$enc = New-Object System.Text.UTF8Encoding($false)

function Flatten-Json([string]$jsonPath, [string]$outPath, [string[]]$skipTops) {
    $raw = [System.IO.File]::ReadAllText($jsonPath, $enc)
    $root = $raw | ConvertFrom-Json
    $lines = New-Object System.Collections.Generic.List[string]

    function Walk($obj, $path) {
        if ($null -eq $obj) {
            $lines.Add("$path`t")
        }
        elseif ($obj -is [System.Collections.IList]) {
            for ($i = 0; $i -lt $obj.Count; $i++) {
                Walk $obj[$i] ($path + "[" + $i + "]")
            }
        }
        elseif ($obj -is [System.Management.Automation.PSCustomObject]) {
            foreach ($p in $obj.PSObject.Properties) {
                $cp = if ($path -eq '') { $p.Name } else { $path + "." + $p.Name }
                Walk $p.Value $cp
            }
        }
        else {
            $lines.Add("$path`t$([string]$obj)")
        }
    }

    foreach ($p in $root.PSObject.Properties) {
        if ($skipTops -contains $p.Name) { continue }
        Walk $p.Value $p.Name
    }

    [System.IO.File]::WriteAllText($outPath, ($lines -join "`r`n"), $enc)
    return $lines.Count
}

$c1 = Flatten-Json 'D:\1011-main\1011-main\1011-main\messages\ja.json' 'D:\1011-main\1011-main\1011-main\messages\work\ja_flat.txt' @('blog','articleVote')
$c2 = Flatten-Json 'D:\1011-main\1011-main\1011-main\messages\en.json' 'D:\1011-main\1011-main\1011-main\messages\work\en_flat.txt' @('blog','articleVote')
Write-Output ("JA leaves (excl blog/articleVote): " + $c1)
Write-Output ("EN leaves (excl blog/articleVote): " + $c2)
