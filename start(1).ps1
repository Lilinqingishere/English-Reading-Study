# ==============================================================================
# English Reading Academy · 一键启动脚本（Windows / PowerShell）
# ------------------------------------------------------------------------------
# 这个脚本面向"考官 / 演示者首次拿到交付包"的场景，目标是：
#   - 双击 一键启动.bat 后，自动检测 Python / Node 环境
#   - 自动用国内镜像（清华 pip + 淘宝 npm）下载依赖
#   - 自动初始化数据库、检测端口、启动前后端
#   - 后端就绪后自动打开浏览器
# 重复运行时会跳过已完成的步骤，启动会很快。
# ==============================================================================

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try { $OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

# ---------- 路径与端口 ----------
$ROOT          = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT       = Join-Path $ROOT 'English-Reading-Study'
$BACKEND       = Join-Path $PROJECT 'backend'
$VENV          = Join-Path $BACKEND '.venv'
$PYTHON_VENV   = Join-Path $VENV 'Scripts\python.exe'
$BACKEND_PORT  = 8001
$FRONTEND_PORT = 5175
$PIP_INDEX     = 'https://pypi.tuna.tsinghua.edu.cn/simple'
$PIP_HOST      = 'pypi.tuna.tsinghua.edu.cn'
$NPM_REGISTRY  = 'https://registry.npmmirror.com'

# ---------- 输出工具 ----------
function Step($name)  { Write-Host "`n========== $name ==========" -ForegroundColor Cyan }
function Info($msg)   { Write-Host "  [i] $msg" -ForegroundColor Gray }
function Ok($msg)     { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Warn($msg)   { Write-Host "  [!] $msg" -ForegroundColor Yellow }
function Fail($msg) {
    Write-Host "`n  [X] $msg" -ForegroundColor Red
    Write-Host "      启动失败，按回车键关闭窗口..." -ForegroundColor Red
    [void](Read-Host)
    exit 1
}

function TestCmd($cmd) {
    return $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

function TestPort($port) {
    # 优先使用 Get-NetTCPConnection（Windows 8+），失败时退回 netstat
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        return $null -ne $conn
    } catch {
        $line = (& netstat -ano -p TCP | Select-String -Pattern ":$port\s+.*LISTENING")
        return $null -ne $line
    }
}

function DownloadWithMirrors([string[]]$urls, [string]$outFile) {
    # 按顺序尝试镜像，成功即返回 $true。为了避免 IWR 进度条拖慢下载，临时禁用 ProgressPreference。
    $prev = $ProgressPreference
    $ProgressPreference = 'SilentlyContinue'
    try {
        foreach ($url in $urls) {
            try {
                Info "尝试镜像：$url"
                Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing -TimeoutSec 90 -ErrorAction Stop
                if ((Test-Path $outFile) -and ((Get-Item $outFile).Length -gt 1024)) {
                    Ok  "下载完成（$([math]::Round((Get-Item $outFile).Length / 1MB, 1)) MB）"
                    return $true
                }
            } catch {
                Warn "该镜像失败（$($_.Exception.Message.Split([char]10)[0])），切换下一个..."
            }
        }
        return $false
    } finally {
        $ProgressPreference = $prev
    }
}

function EnsureNode {
    # 如果系统里已有可用的 node（>=18）直接返回；否则自动下载便携版 Node.js。
    if (TestCmd 'node') {
        try {
            $raw = (& node --version 2>$null).Trim() -replace '^v', ''
            if ($raw -and [int]($raw.Split('.')[0]) -ge 18) {
                Ok "已检测到系统 Node.js v$raw"
                return $true
            }
        } catch {}
    }

    $nodeVer   = '20.18.1'                         # Iron LTS，稳定且镜像覆盖好
    $nodeFold  = "node-v$nodeVer-win-x64"
    $runtime   = Join-Path $ROOT 'runtime'
    $nodeRoot  = Join-Path $runtime 'node'
    $nodeBin   = Join-Path $nodeRoot $nodeFold
    $nodeExe   = Join-Path $nodeBin 'node.exe'

    # 之前下过，直接加入 PATH
    if (Test-Path $nodeExe) {
        $env:PATH = $nodeBin + ';' + $env:PATH
        Ok "复用此前下载的便携版：$nodeExe"
        return $true
    }

    Info "未检测到系统 Node.js，准备自动下载便携版 v$nodeVer（约 30MB，首次 1-3 分钟）"

    if (-not (Test-Path $nodeRoot)) { New-Item -ItemType Directory -Path $nodeRoot -Force | Out-Null }
    $zipPath = Join-Path $nodeRoot 'node.zip'

    $mirrors = @(
        "https://registry.npmmirror.com/-/binary/node/v$nodeVer/$nodeFold.zip",
        "https://mirrors.huaweicloud.com/nodejs/v$nodeVer/$nodeFold.zip",
        "https://mirrors.cloud.tencent.com/nodejs-release/v$nodeVer/$nodeFold.zip",
        "https://nodejs.org/dist/v$nodeVer/$nodeFold.zip"
    )

    if (-not (DownloadWithMirrors $mirrors $zipPath)) {
        Fail "Node.js 所有镜像均下载失败。请检查网络或手动到 https://nodejs.org/ 安装 LTS。"
    }

    Info '解压中（大约 10 秒）...'
    try {
        Expand-Archive -Path $zipPath -DestinationPath $nodeRoot -Force
    } catch {
        Fail "解压 node.zip 失败：$($_.Exception.Message)"
    }
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue

    if (-not (Test-Path $nodeExe)) {
        Fail "解压完成但找不到 node.exe，预期位置：$nodeExe"
    }

    $env:PATH = $nodeBin + ';' + $env:PATH
    Ok "便携版 Node.js v$nodeVer 就绪：$nodeBin"
    return $true
}

# ---------- 横幅 ----------
Clear-Host
Write-Host '======================================================================' -ForegroundColor Magenta
Write-Host '   English Reading Academy 一键启动' -ForegroundColor Magenta
Write-Host '   首次启动会下载约 250MB 依赖（清华 / 淘宝镜像），请耐心等待' -ForegroundColor Magenta
Write-Host '======================================================================' -ForegroundColor Magenta

if (-not (Test-Path $PROJECT)) { Fail "找不到项目目录：$PROJECT" }

# ============================================================================
# Step 1 / 7：Python 环境检测
# ============================================================================
Step '1/7 检测 Python 环境（需要 3.10 及以上）'

$pythonExe = $null
foreach ($candidate in @('python', 'python3', 'py')) {
    if (TestCmd $candidate) {
        try {
            $verRaw = & $candidate -c "import sys; print(f'{sys.version_info[0]}.{sys.version_info[1]}')" 2>$null
            if ($LASTEXITCODE -eq 0 -and $verRaw) {
                $ver = [version]$verRaw
                if ($ver -ge [version]'3.10') {
                    $pythonExe = $candidate
                    Ok "$candidate -> Python $verRaw"
                    break
                } else {
                    Warn "$candidate 版本过低：$verRaw"
                }
            }
        } catch {}
    }
}

if (-not $pythonExe) {
    Fail "未检测到可用的 Python 3.10+。请先到 https://www.python.org/downloads/ 安装，安装时务必勾选 ""Add Python to PATH""。"
}

# ============================================================================
# Step 2 / 7：Node.js 环境检测（缺失时自动下载便携版，无需管理员权限）
# ============================================================================
Step '2/7 检测 Node.js 环境（缺失时自动下载便携版 v20.18.1）'

if (-not (EnsureNode)) { Fail 'Node.js 准备失败' }

if (-not (TestCmd 'npm')) {
    Fail 'Node.js 已就绪但 npm 不可用，这通常是下载/解压不完整。请删除 runtime\node 目录后重试。'
}

$nodeVerRaw = (& node --version).Trim() -replace '^v', ''
$nodeMajor  = [int]($nodeVerRaw.Split('.')[0])
if ($nodeMajor -lt 18) { Fail "Node.js 版本过低：v$nodeVerRaw，需要 >=18。" }
$nodeSrc = (Get-Command node -ErrorAction SilentlyContinue).Source
Ok "Node.js v$nodeVerRaw ($nodeSrc)"

# ============================================================================
# Step 3 / 7：后端 Python 虚拟环境与依赖
# ============================================================================
Step '3/7 准备后端 Python 环境'

if (-not (Test-Path $PYTHON_VENV)) {
    Info "创建虚拟环境：$VENV"
    & $pythonExe -m venv $VENV
    if (-not (Test-Path $PYTHON_VENV)) { Fail '虚拟环境创建失败，请检查 Python 安装是否完整。' }
}
Ok "虚拟环境已就绪：$VENV"

# 用一个轻量的 import 测试判断关键依赖是否齐全，避免每次都重装
$needPipInstall = $true
try {
    & $PYTHON_VENV -c "import fastapi, uvicorn, sqlmodel, dashscope, fsrs" 2>$null
    if ($LASTEXITCODE -eq 0) { $needPipInstall = $false }
} catch {}

if ($needPipInstall) {
    Info '使用清华镜像安装后端依赖（首次约 80MB，1-3 分钟）'
    & $PYTHON_VENV -m pip install --upgrade pip --index-url $PIP_INDEX --trusted-host $PIP_HOST
    if ($LASTEXITCODE -ne 0) { Fail 'pip 升级失败，请检查网络。' }
    & $PYTHON_VENV -m pip install -r (Join-Path $BACKEND 'requirements.txt') --index-url $PIP_INDEX --trusted-host $PIP_HOST
    if ($LASTEXITCODE -ne 0) {
        Warn '清华镜像失败，尝试切换阿里云镜像重试...'
        & $PYTHON_VENV -m pip install -r (Join-Path $BACKEND 'requirements.txt') --index-url 'https://mirrors.aliyun.com/pypi/simple/' --trusted-host 'mirrors.aliyun.com'
        if ($LASTEXITCODE -ne 0) { Fail 'pip 安装失败，请检查网络后重试。' }
    }
    Ok '后端依赖安装完成'
} else {
    Ok '后端依赖已就绪（跳过安装）'
}

# ============================================================================
# Step 4 / 7：前端 npm 依赖
# ============================================================================
Step '4/7 准备前端依赖'

$nodeModules = Join-Path $PROJECT 'node_modules'
$viteBin     = Join-Path $nodeModules 'vite\package.json'

if (-not (Test-Path $viteBin)) {
    Info '使用淘宝镜像安装前端依赖（首次约 150MB，1-3 分钟）'
    Push-Location $PROJECT
    try {
        & npm install --registry=$NPM_REGISTRY --no-audit --no-fund --loglevel=warn
        if ($LASTEXITCODE -ne 0) { Fail 'npm install 失败，请检查网络后重试。' }
    } finally { Pop-Location }
    Ok '前端依赖安装完成'
} else {
    Ok '前端依赖已就绪（跳过安装）'
}

# ============================================================================
# Step 5 / 7：数据库初始化
# ============================================================================
Step '5/7 检查演示数据库'

$dbPath = Join-Path $BACKEND 'data\app.db'
if (-not (Test-Path $dbPath)) {
    Info '未找到 app.db，运行 seed 初始化演示数据...'
    Push-Location $BACKEND
    try {
        & $PYTHON_VENV -m app.services.seed
        if ($LASTEXITCODE -ne 0) { Fail 'seed 初始化失败' }
    } finally { Pop-Location }
}
Ok "数据库已就绪：$dbPath"

# ============================================================================
# Step 6 / 7：端口冲突检测
# ============================================================================
Step '6/7 检查端口占用'

if (TestPort $BACKEND_PORT) {
    Fail "后端端口 $BACKEND_PORT 已被占用。请关闭占用该端口的程序后重试，或在任务管理器结束 python.exe / uvicorn 进程。"
}
if (TestPort $FRONTEND_PORT) {
    Fail "前端端口 $FRONTEND_PORT 已被占用。请关闭占用该端口的程序后重试，或在任务管理器结束 node.exe 进程。"
}
Ok "端口 $BACKEND_PORT 和 $FRONTEND_PORT 可用"

# ============================================================================
# Step 7 / 7：启动前后端
# ============================================================================
Step '7/7 启动前后端服务'

# ---- 启动后端：在新窗口跑 uvicorn，便于观察日志，关闭脚本时不影响 ----
Info "后端启动中：http://127.0.0.1:$BACKEND_PORT"
$backendCmd = "& '" + $PYTHON_VENV + "' -m uvicorn main:app --host 127.0.0.1 --port " + $BACKEND_PORT
Start-Process -FilePath 'powershell.exe' `
    -ArgumentList @('-NoProfile', '-NoExit', '-Command', $backendCmd) `
    -WorkingDirectory $BACKEND | Out-Null

# ---- 等待后端 healthz 200 ----
Info '等待后端就绪（最多 30 秒）...'
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$BACKEND_PORT/healthz" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
}
if ($ready) { Ok '后端 /healthz 200，已就绪' }
else        { Warn '后端 30 秒内未就绪，请查看后端窗口的错误日志。前端仍会启动以便排查。' }

# ---- 准备启动前端，先检查 .env 配置 ----
$envFile = Join-Path $BACKEND '.env'
if (Test-Path $envFile) {
    $envText = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
    if ($envText -match '请在此处填入真实Key') {
        Warn 'backend\.env 里的 DASHSCOPE_API_KEY 仍是占位值，AI 阅读分析接口会返回 503。'
        Warn '若要演示 AI 分析，请到 https://bailian.console.aliyun.com/ 申请 Key 后填入 backend\.env，再重启脚本。'
        Warn '其他页面（阅读拓展、词汇复习、个人中心）不依赖 Key，仍可正常演示。'
    }
}

# ---- 后台延时打开浏览器 ----
$openBrowserCmd = "Start-Sleep -Seconds 4; Start-Process 'http://127.0.0.1:$FRONTEND_PORT/English-Reading-Study/'"
Start-Process -FilePath 'powershell.exe' `
    -ArgumentList @('-NoProfile', '-WindowStyle', 'Hidden', '-Command', $openBrowserCmd) | Out-Null

# ---- 当前窗口跑前端 vite dev ----
Write-Host ''
Write-Host '======================================================================' -ForegroundColor Magenta
Write-Host "  前端启动：http://127.0.0.1:$FRONTEND_PORT/English-Reading-Study/" -ForegroundColor Magenta
Write-Host "  后端日志在另一个 PowerShell 窗口" -ForegroundColor Magenta
Write-Host "  按 Ctrl+C 停止前端；停止前端后请手动关闭后端窗口" -ForegroundColor Magenta
Write-Host '======================================================================' -ForegroundColor Magenta
Write-Host ''

$env:VITE_BACKEND_URL = "http://127.0.0.1:$BACKEND_PORT"
Push-Location $PROJECT
try {
    & npm run dev -- --host 127.0.0.1 --port $FRONTEND_PORT
} finally { Pop-Location }
