# Run this from your frontend/src folder:
# cd C:\Users\Jeremie\Videos\ruscomiks\frontend
# .\strip_comments.ps1

Write-Host "Stripping block comment sections from all TSX/TS files..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Remove block comments that span multiple lines: /* ... */ 
    # This targets the large commented-out code blocks
    $cleaned = $content -replace '(?s)/\*.*?\*/', ''
    
    # Remove single-line // comments that are commented-out code blocks
    # (lines that start with optional whitespace then //)
    $lines = $cleaned -split "`n"
    $result = @()
    $inCommentBlock = $false
    
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        # Keep the line if it's NOT a pure comment line (// something)
        # But keep lines that are legitimate inline comments inside code
        if ($trimmed -match '^//' -and $trimmed.Length -gt 2) {
            # Skip pure comment lines
            continue
        }
        $result += $line
    }
    
    # Remove excessive blank lines (more than 2 consecutive)
    $final = ($result -join "`n") -replace '(\r?\n){3,}', "`n`n"
    
    Set-Content $file.FullName $final -NoNewline
    Write-Host "  Cleaned: $($file.Name)" -ForegroundColor Green
}

Write-Host "`nDone! Now run: rmdir /s /q node_modules\.vite && npm run dev" -ForegroundColor Yellow