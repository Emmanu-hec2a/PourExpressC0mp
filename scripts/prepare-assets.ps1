param(
  [Parameter(Mandatory=$true)][string]$CustomerHome,
  [Parameter(Mandatory=$true)][string]$CustomerStores,
  [Parameter(Mandatory=$true)][string]$TrackingRedacted,
  [Parameter(Mandatory=$true)][string]$RiderRedacted,
  [Parameter(Mandatory=$true)][string]$BrandEditorial
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$websiteRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$assetRoot = Join-Path $websiteRoot 'public\images'
New-Item -ItemType Directory -Path $assetRoot -Force | Out-Null

function Save-WebsiteJpeg([string]$Source, [string]$Name, [int]$Width) {
  $sourceImage = [System.Drawing.Image]::FromFile([System.IO.Path]::GetFullPath($Source))
  $height = [int][Math]::Round($sourceImage.Height * $Width / $sourceImage.Width)
  $bitmap = New-Object System.Drawing.Bitmap($Width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $settings = New-Object System.Drawing.Imaging.EncoderParameters(1)
  try {
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($sourceImage, 0, 0, $Width, $height)
    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
    $settings.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]83)
    $bitmap.Save((Join-Path $assetRoot $Name), $encoder, $settings)
  } finally { $settings.Dispose(); $graphics.Dispose(); $bitmap.Dispose(); $sourceImage.Dispose() }
}

# Never copy the unredacted rider/tracking source images into public assets.
Save-WebsiteJpeg $CustomerHome 'customer-home.jpg' 678
Save-WebsiteJpeg $CustomerStores 'customer-stores.jpg' 678
Save-WebsiteJpeg $TrackingRedacted 'customer-tracking-redacted.jpg' 678
Save-WebsiteJpeg $RiderRedacted 'rider-navigation-redacted.jpg' 678
Save-WebsiteJpeg $BrandEditorial 'brand-editorial.jpg' 1200

$originalLogo = [System.Drawing.Image]::FromFile((Join-Path $websiteRoot 'src\assets\logo.png'))
$brandLogo = New-Object System.Drawing.Bitmap(256, 150)
$logoGraphics = [System.Drawing.Graphics]::FromImage($brandLogo)
try {
  $logoGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $logoGraphics.DrawImage($originalLogo, (New-Object System.Drawing.Rectangle(0, 0, 256, 150)), (New-Object System.Drawing.Rectangle(410, 105, 600, 350)), [System.Drawing.GraphicsUnit]::Pixel)
  $brandLogo.Save((Join-Path $assetRoot 'brand-logo.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally { $logoGraphics.Dispose(); $brandLogo.Dispose(); $originalLogo.Dispose() }
& (Join-Path $PSScriptRoot 'prepare-brand-assets.ps1')
Get-ChildItem -LiteralPath $assetRoot | Select-Object Name,Length
