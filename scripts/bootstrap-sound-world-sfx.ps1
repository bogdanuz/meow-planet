# Letters (Windows SAPI) + CC0 from scripts/sound-world-sfx-sources.json
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outDir = Join-Path $root 'public\assets\games\sound-world\sfx'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = -2
$synth.Volume = 90

$ruCodePoints = @(
  0x0410, 0x0411, 0x0412, 0x0413, 0x0414, 0x0415, 0x0401, 0x0416, 0x0417, 0x0418, 0x0419,
  0x041A, 0x041B, 0x041C, 0x041D, 0x041E, 0x041F, 0x0420, 0x0421, 0x0422, 0x0423, 0x0424,
  0x0425, 0x0426, 0x0427, 0x0428, 0x0429, 0x042A, 0x042B, 0x042C, 0x042D, 0x042E, 0x042F
)
foreach ($cp in $ruCodePoints) {
  $ch = [char]$cp
  $path = Join-Path $outDir ("letter-ru-{0}.wav" -f $ch)
  $synth.SetOutputToWaveFile($path)
  $synth.Speak($ch.ToString())
  $synth.SetOutputToDefaultAudioDevice()
}

foreach ($cp in 65..90) {
  $ch = [char]$cp
  $path = Join-Path $outDir ("letter-en-{0}.wav" -f $ch)
  $synth.SetOutputToWaveFile($path)
  $synth.Speak($ch.ToString())
  $synth.SetOutputToDefaultAudioDevice()
}

Write-Host "Letters: $($ruCodePoints.Count + 26) wav in $outDir"

$jsonPath = Join-Path $root 'scripts\sound-world-sfx-sources.json'
if (Test-Path $jsonPath) {
  $cfg = Get-Content $jsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($d in $cfg.downloads) {
    $ext = [IO.Path]::GetExtension($d.file)
    if (-not $ext) { $ext = '.wav' }
    $dest = Join-Path $outDir ($d.id + $ext)
    Write-Host "Download $($d.id) ..."
    curl.exe -fsSL -o $dest $d.url
  }
}

$names = Get-ChildItem $outDir -File | Where-Object { $_.Name -ne 'inventory.json' } | ForEach-Object { $_.BaseName }
$invPath = Join-Path $outDir 'inventory.json'
$names | ConvertTo-Json -Compress | Set-Content -Path $invPath -Encoding UTF8
Write-Host "inventory.json: $($names.Count) entries"
Write-Host 'Done.'
