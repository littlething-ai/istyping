function New-HardLinkMirror {
    <#
    .SYNOPSIS
        递归地将源目录下的所有文件硬链接到目标目录，保持目录结构。
        默认开启镜像同步模式（会自动删除目标目录中多余的文件）。
        支持使用正则表达式数组忽略特定文件或目录。
    #>
    param (
        [Parameter(Mandatory=$true, Position=0)]
        [string]$SourcePath,

        [Parameter(Mandatory=$true, Position=1)]
        [string]$DestPath,

        [Parameter(Mandatory=$false)]
        [switch]$Prune = $true,

        [Parameter(Mandatory=$false)]
        [string[]]$Exclude = @() # <--- 现在这里接收的是正则表达式列表
    )

    $SourceAbsPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($SourcePath)
    $DestAbsPath   = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($DestPath)

    # 1. 基础检查
    if (!(Test-Path $SourceAbsPath)) {
        Write-Error "源目录不存在: $SourceAbsPath"
        return
    }

    if ((Split-Path $SourceAbsPath -Qualifier) -ne (Split-Path $DestAbsPath -Qualifier)) {
        Write-Error "错误: 硬链接不能跨分区创建"
        return
    }

    Write-Host "正在创建硬链接镜像..." -ForegroundColor Yellow
    Write-Host "源 (Source): $SourceAbsPath"
    Write-Host "目 (Target): $DestAbsPath"
    
    if ($Prune) { Write-Host "模式: 镜像同步 (Target 中多余文件将被删除)" -ForegroundColor Magenta }
    else { Write-Host "模式: 仅增量 (Target 中多余文件将保留)" -ForegroundColor Gray }

    if ($Exclude.Count -gt 0) {
        Write-Host "排除规则 (Regex): $($Exclude -join ', ')" -ForegroundColor DarkCyan
    }
    Write-Host ("-" * 50)

    if (!(Test-Path $DestAbsPath)) { 
        New-Item -ItemType Directory -Path $DestAbsPath -Force | Out-Null 
    }

    # -----------------------------------------------------------
    # 2. 正向遍历：源 -> 目标 (创建链接)
    # -----------------------------------------------------------
    Get-ChildItem -Path $SourceAbsPath -File -Recurse | ForEach-Object {
        $RelativePath = $_.FullName.Substring($SourceAbsPath.Length)

        # 【修改点】逐个校验正则表达式
        $isExcluded = $false
        foreach ($pattern in $Exclude) {
            if ($RelativePath -match $pattern) {
                $isExcluded = $true
                break
            }
        }
        if ($isExcluded) { return } # 跳过当前文件

        $TargetFile = Join-Path $DestAbsPath $RelativePath
        $TargetDir = Split-Path $TargetFile
        
        if (!(Test-Path $TargetDir)) { 
            New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null 
        }

        if (!(Test-Path $TargetFile)) {
            try {
                New-Item -ItemType HardLink -Path $TargetFile -Target $_.FullName | Out-Null
                Write-Host "Linked : $RelativePath" -ForegroundColor Cyan
            }
            catch {
                Write-Host "Error  : $($_.Name) - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }

    # -----------------------------------------------------------
    # 3. 反向遍历：目标 -> 源 (清理多余文件/文件夹)
    # -----------------------------------------------------------
    if ($Prune) {
        Write-Host "`n正在清理多余文件..." -ForegroundColor Yellow
        
        $DestItems = Get-ChildItem -Path $DestAbsPath -Recurse | Sort-Object FullName -Descending

        foreach ($Item in $DestItems) {
            $RelPath = $Item.FullName.Substring($DestAbsPath.Length)

            # 【修改点】逐个校验正则表达式
            $isExcluded = $false
            foreach ($pattern in $Exclude) {
                if ($RelPath -match $pattern) {
                    $isExcluded = $true
                    break
                }
            }
            if ($isExcluded) { continue } # 忽略的目录/文件不参与删除

            $SourceCheckPath = Join-Path $SourceAbsPath $RelPath

            if (!(Test-Path $SourceCheckPath)) {
                try {
                    Remove-Item -Path $Item.FullName -Force -Recurse -ErrorAction Stop
                    Write-Host "Removed: $RelPath" -ForegroundColor Magenta
                }
                catch {
                    Write-Host "Unable to remove: $RelPath ($($_.Exception.Message))" -ForegroundColor Red
                }
            }
        }
    }
    
    Write-Host "`n完成。" -ForegroundColor Green
}


$DEFAULT_EXCLUDE_LIST = @(".git", "node_modules", "dist")


New-HardLinkMirror -SourcePath "..\istyping_memory" -DestPath ".\ref\memory" -Exclude $DEFAULT_EXCLUDE_LIST
