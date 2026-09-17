$ErrorActionPreference = 'Stop'
$enc = [System.Text.Encoding]::UTF8
$jaPath = 'D:\1011-main\1011-main\1011-main\messages\ja.json'
$enPath = 'D:\1011-main\1011-main\1011-main\messages\en.json'

$jaRaw = [System.IO.File]::ReadAllText($jaPath, $enc)
$enRaw = [System.IO.File]::ReadAllText($enPath, $enc)

$ja = $jaRaw | ConvertFrom-Json -AsHashtable
$en = $enRaw | ConvertFrom-Json -AsHashtable

# patterns (regex), with category label
$patterns = [ordered]@{
    'KATAKANA:デバイス'       = 'デバイス'
    'KATAKANA:パートナーシップ' = 'パートナーシップ'
    'KATAKANA:ソリューション'   = 'ソリューション'
    'KATAKANA:ブランド'        = 'ブランド'
    'KATAKANA:マーケット'       = 'マーケット'
    'KATAKANA:ポジショニング'   = 'ポジショニング'
    'KATAKANA:リードタイム'     = 'リードタイム'
    'KATAKANA:ラグジュアリー'   = 'ラグジュアリー'
    'KATAKANA:クーリング'       = 'クーリング'
    'KATAKANA:スケール'         = 'スケール'
    'KATAKANA:プライベートレーベル' = 'プライベートレーベル'
    'KATAKANA:カスタマイズ'     = 'カスタマイズ'
    'KATAKANA:パッケージング'   = 'パッケージング'
    'KATAKANA:ポジション'       = 'ポジション'
    'KATAKANA:コンセプト'       = 'コンセプト'
    'KATAKANA:バリュー'         = 'バリュー'
    'KATAKANA:コラボレーション' = 'コラボレーション'
    'KATAKANA:インテグレーション' = 'インテグレーション'
    'KATAKANA:エクスペリエンス' = 'エクスペリエンス'
    'KATAKANA:プロフェッショナル' = 'プロフェッショナル'
    'KATAKANA:ポータブル'       = 'ポータブル'
    'KATAKANA:プレミアム'       = 'プレミアム'
    'KATAKANA:エクスクルーシブ' = 'エクスクルーシブ'
    'KATAKANA:エレガント'       = 'エレガント'
    'KATAKANA:コンパクト'       = 'コンパクト'
    'KATAKANA:セッション'       = 'セッション'
    'KATAKANA:プラットフォーム' = 'プラットフォーム'
    'KATAKANA:テクノロジー'     = 'テクノロジー'
    'EN:device'               = '(?i)\bdevice\b'
    'EN:brand'                = '(?i)\bbrand\b'
    'EN:solution'             = '(?i)\bsolution\b'
    'EN:partnership'          = '(?i)\bpartnership\b'
    'EN:private label'        = '(?i)\bprivate\s+label\b'
    'EN:luxury'               = '(?i)\bluxury\b'
    'EN:cooling'              = '(?i)\bcooling\b'
    'EN:manufacturer'         = '(?i)\bmanufacturer\b'
    'EN:factory'              = '(?i)\bfactory\b'
    'EN:experience'           = '(?i)\bexperience\b'
    'EN:market'               = '(?i)\bmarket\b'
    'EN:scale'                = '(?i)\bscale\b'
    'EN:quality'              = '(?i)\bquality\b'
    'EN:design'               = '(?i)\bdesign\b'
    'EN:custom'               = '(?i)\bcustom\b'
    'EN:service'              = '(?i)\bservice\b'
    'EN:contact'              = '(?i)\bcontact\b'
    'EN:product'              = '(?i)\bproduct\b'
    'EN:technology'           = '(?i)\btechnology\b'
    'EN:team'                 = '(?i)\bteam\b'
    'EN:company'              = '(?i)\bcompany\b'
    'EN:home'                 = '(?i)\bhome\b'
    'EN:shop'                 = '(?i)\bshop\b'
    'EN:shopify'              = '(?i)\bshopify\b'
}

$sb = New-Object System.Text.StringBuilder

function Walk($obj, $path) {
    if ($obj -is [System.Collections.IDictionary]) {
        foreach ($k in $obj.Keys) {
            $childPath = if ($path -eq '') { $k } else { "$path.$k" }
            Walk $obj[$k] $childPath
        }
    }
    elseif ($obj -is [System.Collections.IList]) {
        for ($i = 0; $i -lt $obj.Count; $i++) {
            Walk $obj[$i] "$path[$i]"
        }
    }
    else {
        $val = [string]$obj
        if ($null -eq $val) { $val = '' }
        # record all leaves for en/ja diff too
        [void]$script:allLeaves.Add("$path`t$val")
    }
}

# Walk ja, capturing matches
$allLeaves = New-Object System.Collections.Generic.List[string]
$script:allLeaves = $allLeaves

foreach ($topKey in $ja.Keys) {
    if ($topKey -eq 'blog' -or $topKey -eq 'articleVote') { continue }
    Walk $ja[$topKey] $topKey
}

# Now scan each leaf against patterns
$out = New-Object System.Text.StringBuilder
[void]$out.AppendLine("=== JA pattern matches (excluding blog/articleVote) ===")
foreach ($leaf in $allLeaves) {
    $parts = $leaf -split "`t", 2
    $path = $parts[0]
    $val = if ($parts.Count -gt 1) { $parts[1] } else { '' }
    foreach ($cat in $patterns.Keys) {
        $rx = $patterns[$cat]
        if ($val -match $rx) {
            [void]$out.AppendLine("[$cat] $path => $val")
        }
    }
}

# Also dump: top-level keys with leaf counts
[void]$out.AppendLine("")
[void]$out.AppendLine("=== Top-level key stats (ja) ===")
foreach ($topKey in $ja.Keys) {
    $c = 0
    foreach ($leaf in $allLeaves) {
        if ($leaf -like "$topKey.*" -or $leaf -eq $topKey) { $c++ }
    }
    [void]$out.AppendLine("$topKey : $c leaves")
}

[System.IO.File]::WriteAllText('D:\1011-main\1011-main\1011-main\messages\work\ja_scan_result.txt', $out.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "DONE. total leaves scanned: $($allLeaves.Count)"
