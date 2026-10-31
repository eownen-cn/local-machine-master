param([int]$Port = 5173, [switch]$NoBrowser, [string]$DataDirectory = '')
$ErrorActionPreference = 'Stop'
$body = [IO.File]::ReadAllBytes((Join-Path $PSScriptRoot 'EnglishGrove.html'))
if (-not $DataDirectory) { $DataDirectory = Join-Path $PSScriptRoot 'grove-data' }
[IO.Directory]::CreateDirectory($DataDirectory) | Out-Null
$dataFile = Join-Path $DataDirectory 'learning.json'
function New-State { return @{version=2;entries=@{}} }
function Convert-State($obj) {
 if ($null -eq $obj -or $obj.version -ne 2 -or $null -eq $obj.entries -or $obj.entries -is [Array]) { throw 'Invalid state' }
 $entries = @{}
 foreach ($p in $obj.entries.PSObject.Properties) {
  if ($p.Name -notmatch '^(done|word|mistake|recall|session|draft|custom|pref):[\w\-:.]{1,180}$') { throw 'Invalid key' }
  $e = $p.Value
  if ($null -eq $e -or 'at' -notin $e.PSObject.Properties.Name -or 'value' -notin $e.PSObject.Properties.Name -or $null -eq $e.at -or ($e.at -is [string] -or $e.at -is [bool]) -or [double]$e.at -lt 0 -or [double]::IsNaN([double]$e.at) -or [double]::IsInfinity([double]$e.at)) { throw 'Invalid timestamp' }
  $value = $e.value
  if ($null -ne $value) {
   $type = $p.Name.Split(':')[0]
   switch ($type) {
    'done' { if ($value -isnot [bool] -or -not $value) { throw 'Invalid completion' } }
    'pref' { if ($value -is [string] -or $value -is [bool] -or $value -notin @(3,5,15,25)) { throw 'Invalid preference' } }
    'draft' { if ($value -isnot [string] -or $value.Length -gt 20000) { throw 'Invalid draft' } }
    'word' { foreach($k in @('word','meaning','example','source')) { if ($value.$k -isnot [string] -or $value.$k.Length -gt 2000) { throw 'Invalid word' } }; if (-not $value.word -or $value.word.Length -gt 160 -or $value.meaning.Length -gt 500 -or $value.source.Length -gt 160) { throw 'Invalid word' } }
    'mistake' { foreach($k in @('prompt','answer','explanation','source')) { if ($value.$k -isnot [string] -or $value.$k.Length -gt 2000) { throw 'Invalid mistake' } }; if ($value.source.Length -gt 160) { throw 'Invalid source' } }
    'recall' { foreach($k in @('due','interval','count')) { if ($null -eq $value.$k -or ($value.$k -is [string] -or $value.$k -is [bool]) -or [double]$value.$k -lt 0) { throw 'Invalid recall' } } }
    'session' { if ($value.date -is [datetime]) { $value.date = $value.date.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }; foreach($k in @('unit','skill','date')) { if ($value.$k -isnot [string] -or $value.$k.Length -gt 160) { throw 'Invalid session' } }; if ($value.skill.Length -gt 30 -or $value.date.Length -gt 30 -or $null -eq $value.seconds -or ($value.seconds -is [string] -or $value.seconds -is [bool]) -or [double]$value.seconds -lt 0 -or [double]$value.seconds -gt 86400) { throw 'Invalid seconds' } }
    'custom' {
     foreach($k in @('id','title','subtitle','passage','translation','focus','rule','example')) { if ($value.$k -isnot [string] -or -not $value.$k.Trim() -or $value.$k.Length -gt 15000) { throw 'Invalid course' } }
     if ($value.id -notmatch '^[a-z0-9-]{1,80}$' -or $value.level -notin @('A2','B1','B2','IELTS')) { throw 'Invalid course identity' }
     foreach($k in @('title','subtitle','focus')) { if($value.$k.Length -gt 160) { throw 'Invalid course title' } }
     if($value.translation.Length -gt 2000 -or $value.rule.Length -gt 2000 -or $value.example.Length -gt 500) { throw 'Invalid course text' }
     if ($value.reading -isnot [Array] -or $value.reading.Count -lt 1 -or $value.reading.Count -gt 15 -or $value.words -isnot [Array] -or $value.words.Count -gt 50) { throw 'Invalid course arrays' }
     $questions = @($value.grammar) + @($value.reading)
     foreach($q in $questions) { if ($null -eq $q -or $q.prompt -isnot [string] -or -not $q.prompt.Trim() -or $q.prompt.Length -gt 500 -or $q.options -isnot [Array] -or $q.options.Count -lt 2 -or $q.options.Count -gt 5 -or $null -eq $q.answer -or ($q.answer -is [string] -or $q.answer -is [bool]) -or [double]$q.answer -ne [math]::Floor([double]$q.answer) -or $q.answer -lt 0 -or $q.answer -ge $q.options.Count -or $q.explanation -isnot [string] -or -not $q.explanation.Trim() -or $q.explanation.Length -gt 1500) { throw 'Invalid question' }; foreach($option in $q.options) { if($option -isnot [string] -or -not $option.Trim() -or $option.Length -gt 500) { throw 'Invalid option' } } }
     foreach($w in $value.words) { if($w.word -isnot [string] -or -not $w.word.Trim() -or $w.word.Length -gt 160 -or $w.meaning -isnot [string] -or -not $w.meaning.Trim() -or $w.meaning.Length -gt 500) { throw 'Invalid vocabulary' } }
    }
   }
  }
  $entries[$p.Name] = @{at=$e.at;value=$value}
 }
 if ($entries.Count -gt 20000) { throw 'Too many entries' }
 return @{version=2;entries=$entries}
}
$state = New-State
if ([IO.File]::Exists($dataFile)) { $state = Convert-State ([IO.File]::ReadAllText($dataFile) | ConvertFrom-Json) }
$random = New-Object byte[] 16
$rng = [Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($random); $rng.Dispose()
$token = ([BitConverter]::ToString($random)).Replace('-','').ToLowerInvariant()
$listener = New-Object Net.Sockets.TcpListener([Net.IPAddress]::Any, $Port)
$listener.Start()
Write-Host 'English Grove 0.2 - keep this window open.'
Write-Host "Computer: http://localhost:$Port"
try { Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*' } | ForEach-Object { Write-Host ("LAN: http://" + $_.IPAddress + ":$Port") } } catch { Write-Host 'Use ipconfig to find the Wi-Fi IPv4 address.' }
Write-Host "Pairing code: $token"
Write-Host 'Enter this code in Settings on each device for shared progress.'
Write-Host 'Trusted PRIVATE Wi-Fi only. Do not expose this port to the Internet.'
if (-not $NoBrowser) { Start-Process "http://localhost:$Port" }
try {
 while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
   $client.ReceiveTimeout=8000; $client.SendTimeout=8000
   $stream=$client.GetStream();$headerBytes=New-Object 'Collections.Generic.List[byte]'
   while ($true) { $n=$stream.ReadByte();if ($n -lt 0) { throw 'Closed request' };$headerBytes.Add([byte]$n);$count=$headerBytes.Count;if($count -gt 16384) { throw 'Headers too large' };if($count -ge 4 -and $headerBytes[$count-4] -eq 13 -and $headerBytes[$count-3] -eq 10 -and $headerBytes[$count-2] -eq 13 -and $headerBytes[$count-1] -eq 10) { break } }
   $lines=([Text.Encoding]::ASCII.GetString($headerBytes.ToArray())) -split "`r`n"
   $request=$lines[0] -split ' ';$method=$request[0];$path=($request[1] -split '\?')[0];$headers=@{}
   foreach($line in $lines[1..($lines.Length-1)]) { $parts=$line -split ':',2;if($parts.Length -eq 2) { $headers[$parts[0].ToLowerInvariant()]=$parts[1].Trim() } }
   $status=200;$type='application/json';$response='';$responseBytes=$null
   if ($path -eq '/api/health') { $response='{"service":"grove-lan","version":2}' }
   elseif ($path -eq '/api/sync') {
    if($method -ne 'POST') { $status=405;$response='{"error":"POST required"}' }
    elseif($headers['authorization'] -cne "Bearer $token") { $status=401;$response='{"error":"Pairing code required"}' }
    elseif($headers['origin'] -and ([Uri]$headers['origin']).Authority -ne $headers['host']) { $status=403;$response='{"error":"Origin not allowed"}' }
    else {
     $length=0
     if(-not [int]::TryParse($headers['content-length'],[ref]$length) -or $length -lt 0 -or $length -gt 4194304) { $status=413;$response='{"error":"Invalid request size"}' }
     else {
      $data=New-Object byte[] $length;$read=0
      while($read -lt $length) { $n=$stream.Read($data,$read,$length-$read);if($n -le 0) { throw 'Incomplete body' };$read+=$n }
      try {
       $remote=Convert-State ([Text.Encoding]::UTF8.GetString($data) | ConvertFrom-Json)
       $merged=@{version=2;entries=@{}}
       foreach($k in $state.entries.Keys) { $merged.entries[$k]=$state.entries[$k] }
       foreach($k in $remote.entries.Keys) { $e=$remote.entries[$k];$old=$merged.entries[$k];if($null -eq $old -or [double]$e.at -gt [double]$old.at -or ([double]$e.at -eq [double]$old.at -and [StringComparer]::Ordinal.Compare(($e.value | ConvertTo-Json -Depth 50 -Compress),($old.value | ConvertTo-Json -Depth 50 -Compress)) -gt 0)) { $merged.entries[$k]=$e } }
       if($merged.entries.Count -gt 20000) { throw 'Too many entries' }
       $response=$merged | ConvertTo-Json -Depth 50 -Compress
       [IO.File]::WriteAllText($dataFile+'.tmp',$response,(New-Object Text.UTF8Encoding($false)))
       if([IO.File]::Exists($dataFile)) { [IO.File]::Replace($dataFile+'.tmp',$dataFile,$dataFile+'.bak') } else { [IO.File]::Move($dataFile+'.tmp',$dataFile) }
       $state=$merged
      } catch { $status=400;$response='{"error":"Invalid learning data; existing data preserved"}' }
     }
    }
   }
   elseif($path.StartsWith('/api/')) { $status=404;$response='{"error":"Unknown endpoint"}' }
   elseif($method -eq 'GET' -or $method -eq 'HEAD') { $type='text/html';$responseBytes=$body }
   else { $status=405;$response='{"error":"Method not allowed"}' }
   if($null -eq $responseBytes) { $responseBytes=[Text.Encoding]::UTF8.GetBytes($response) }
   $responseHeader="HTTP/1.1 $status Response`r`nContent-Type: $type; charset=utf-8`r`nContent-Length: $($responseBytes.Length)`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`nConnection: close`r`n`r`n"
   $bytes=[Text.Encoding]::ASCII.GetBytes($responseHeader);$stream.Write($bytes,0,$bytes.Length)
   if($method -ne 'HEAD') { $stream.Write($responseBytes,0,$responseBytes.Length) };$stream.Flush()
  } catch { Write-Host 'Request interrupted; existing learning data preserved.' }
  finally { $client.Close() }
 }
} finally { $listener.Stop() }
