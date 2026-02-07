$port = 8080
$root = Resolve-Path "."
$listener = New-Object System.Net.HttpListener

# Try to bind to all interfaces; if fails, fall back to localhost
try {
    $listener.Prefixes.Add("http://*:$port/")
    $listener.Start()
    Write-Host "Server running globally at http://*:$port/"
    Write-Host "Local: http://localhost:$port/"
    Write-Host "Mobile: http://$((Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi').IPAddress):$port/"
} catch {
    Write-Warning "Could not bind to all interfaces (Requires Admin). Falling back to localhost only."
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    try {
        $listener.Start()
        Write-Host "Server running at http://localhost:$port/"
        Write-Host "NOTE: Mobile access is NOT available because the server could not bind to the network interface."
        Write-Host "To enable mobile access, please run this script as Administrator."
    } catch {
        Write-Error "Failed to start listener on localhost: $_"
        exit
    }
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $run = [runspacefactory]::CreateRunspace()
    $run.Open()
    $ps = [powershell]::Create()
    $ps.Runspace = $run
    $ps.AddScript({
        param($context, $root)
        $path = Join-Path $root $context.Request.Url.LocalPath
        if (Test-Path $path -PathType Container) { $path = Join-Path $path "index.html" }
        $response = $context.Response
        if (Test-Path $path -PathType Leaf) {
            try {
                $content = [System.IO.File]::ReadAllBytes($path)
                $response.ContentLength64 = $content.Length
                $response.OutputStream.Write($content, 0, $content.Length)
            } catch { $response.StatusCode = 500 }
        } else { $response.StatusCode = 404 }
        $response.Close()
    }).AddArgument($context).AddArgument($root) | Out-Null
    $ps.BeginInvoke()
}
