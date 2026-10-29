# Code-native companion to public/images/brand-mark.svg. No AI or font in the icon.
# PNG output is checked in; this Windows-only asset helper is not required by CI.
param()
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$websiteRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$assetRoot = Join-Path $websiteRoot 'public\images'
New-Item -ItemType Directory -Path $assetRoot -Force | Out-Null
$brandConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $websiteRoot 'src\config\site.js')
$brandMatch = [regex]::Match($brandConfig, "(?m)^\s*name:\s*'([^']+)'")
if (-not $brandMatch.Success) { throw 'Cannot read the public brand name from site.js' }
$brandName = $brandMatch.Groups[1].Value

function Save-BrandIcon([int]$Size, [string]$Filename) {
  $large = New-Object System.Drawing.Bitmap(($Size * 4), ($Size * 4))
  $graphics = [System.Drawing.Graphics]::FromImage($large)
  $forest = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0d3b30'))
  $cream = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f5f5ef'))
  $orange = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f97316'))
  $background = New-Object System.Drawing.Drawing2D.GraphicsPath
  $letter = New-Object System.Drawing.Drawing2D.GraphicsPath
  $icon = New-Object System.Drawing.Bitmap($Size, $Size)
  $output = [System.Drawing.Graphics]::FromImage($icon)
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.ScaleTransform(($Size * 4 / 64), ($Size * 4 / 64))
    $background.AddArc(0, 0, 28, 28, 180, 90)
    $background.AddArc(36, 0, 28, 28, 270, 90)
    $background.AddArc(36, 36, 28, 28, 0, 90)
    $background.AddArc(0, 36, 28, 28, 90, 90)
    $background.CloseFigure()
    $graphics.FillPath($forest, $background)

    # White P with a transparent counter, matching the editable SVG path.
    $letter.AddLine(20, 16, 36, 16)
    $letter.AddArc(24, 16, 24, 24, 270, 180)
    $letter.AddLine(36, 40, 28, 40)
    $letter.AddLine(28, 40, 28, 48)
    $letter.AddLine(28, 48, 20, 48)
    $letter.CloseFigure()
    $letter.StartFigure()
    $letter.AddLine(28, 24, 28, 32)
    $letter.AddLine(28, 32, 36, 32)
    $letter.AddArc(32, 24, 8, 8, 90, -180)
    $letter.CloseFigure()
    $graphics.FillPath($cream, $letter)
    $graphics.FillEllipse($orange, [single]44.5, [single]43.5, [single]9, [single]9)

    $output.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $output.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $output.DrawImage($large, 0, 0, $Size, $Size)
    $icon.Save((Join-Path $assetRoot $Filename), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $output.Dispose(); $icon.Dispose(); $letter.Dispose(); $background.Dispose()
    $orange.Dispose(); $cream.Dispose(); $forest.Dispose(); $graphics.Dispose(); $large.Dispose()
  }
}

Save-BrandIcon 96 'favicon.png'
Save-BrandIcon 180 'apple-touch-icon.png'

# Preserve the existing sharing-card composition; update only approved branding.
$card = New-Object System.Drawing.Bitmap(1200, 630)
$cardGraphics = [System.Drawing.Graphics]::FromImage($card)
$creamBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f5f5ef'))
$orangeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f97316'))
$titleFont = New-Object System.Drawing.Font('Segoe UI', 64, [System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font('Segoe UI', 25)
try {
  $cardGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#0d3b30'))
  $cardGraphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $cardGraphics.FillRectangle($orangeBrush, 65, 64, 70, 7)
  $cardGraphics.DrawString($brandName, $labelFont, $creamBrush, 65, 104)
  $cardGraphics.DrawString('Local stores.', $titleFont, $creamBrush, 60, 190)
  $cardGraphics.DrawString('Connected.', $titleFont, $creamBrush, 60, 285)
  $cardGraphics.DrawString('Android available. App Store coming soon.', $labelFont, $creamBrush, 65, 465)
  $card.Save((Join-Path $assetRoot 'social-card.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $labelFont.Dispose(); $titleFont.Dispose(); $orangeBrush.Dispose(); $creamBrush.Dispose()
  $cardGraphics.Dispose(); $card.Dispose()
}
Write-Output ('Prepared ' + $brandName + ' SVG-companion icons and sharing card.')
