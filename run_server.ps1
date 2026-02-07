$port = 8080
$root = Resolve-Path "."
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$port/")
try {
    $listener.Start()
    Write-Host "Server running at http://localhost:$port/"
    Write-Host "For mobile access, use: http://$((Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi').IPAddress):$port/"
} catch {
    Write-Error "Failed to start listener: $_"
    Write-Host "You may need to run PowerShell as Administrator."
    exit
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $path = Join-Path $root $context.Request.Url.LocalPath
    
    # Default to index.html for directories
    if (Test-Path $path -PathType Container) {
        $path = Join-Path $path "index.html"
    }

    $response = $context.Response
    
    if (Test-Path $path -PathType Leaf) {
        try {
            $content = [System.IO.File]::ReadAllBytes($path)
            $response.ContentLength64 = $content.Length
            # Basic mime type detection
            $ext = [System.IO.Path]::GetExtension($path).ToLower()
            switch ($ext) {
                ".html" { $response.ContentType = "text/html" }
                ".css"  { $response.ContentType = "text/css" }
                ".js"   { $response.ContentType = "application/javascript" }
                ".png"  { $response.ContentType = "image/png" }
                ".jpg"  { $response.ContentType = "image/jpeg" }
                ".gif"  { $response.ContentType = "image/gif" }
            }
            $response.OutputStream.Write($content, 0, $content.Length)
        } catch {
            $response.StatusCode = 500
        }
    } else {
        $response.StatusCode = 404
    }
    $response.Close()
}
