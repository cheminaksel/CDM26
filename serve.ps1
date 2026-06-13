# Mini-serveur de fichiers statiques (pour l'aperçu uniquement).
# Gère aussi POST /save/<chemin> pour écrire un fichier généré côté navigateur.
$port = 8126
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"

$mime = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8";
  ".js"="application/javascript; charset=utf-8"; ".json"="application/json";
  ".png"="image/png"; ".jpg"="image/jpeg"; ".svg"="image/svg+xml"; ".ico"="image/x-icon"
}

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)

    if ($req.HttpMethod -eq "POST" -and $path.StartsWith("/save/")) {
      $rel = $path.Substring("/save/".Length) -replace "\.\.", ""
      $target = Join-Path $root $rel
      $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
      $body = $reader.ReadToEnd(); $reader.Close()
      $dir = Split-Path $target -Parent
      if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
      [System.IO.File]::WriteAllText($target, $body, (New-Object System.Text.UTF8Encoding($false)))
      $ctx.Response.AddHeader("Access-Control-Allow-Origin", "*")
      $msg = [System.Text.Encoding]::UTF8.GetBytes("OK $rel ($($body.Length) chars)")
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
      $ctx.Response.Close()
      continue
    }

    if ($path -eq "/") { $path = "/index.html" }
    $file = Join-Path $root ($path.TrimStart("/"))
    if (Test-Path $file -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] }
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $ctx.Response.Close()
  } catch { }
}
