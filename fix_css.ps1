$path = 'C:\Users\tushar\.gemini\antigravity\playground\seedance-studio\app\globals.css'
$content = Get-Content $path -Raw

# Fix nav height: 60 -> 64
$content = $content -replace 'height: 64px;', 'height: 66px;'

# Add overflow hidden after the mobile-bottom-nav closing brace (find padding-right: 0; block and add after)
$content = $content -replace '(padding-right: 0;\s*\})', "padding-right: 0;`r`n        overflow: hidden;`r`n    }`r`n`r`n    .mobile-bottom-nav a {`r`n        overflow: hidden;`r`n    }"

Set-Content $path $content -NoNewline
Write-Host "Done"
