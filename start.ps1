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
# Step 2 / 7：Node.js 环境检测
# ============================================================================
Step '2/7 检测 Node.js 环境（需要 18 及以上）'

if (-not (TestCmd 'node')) {
    Fail "未检测到 Node.js。请先到 https://nodejs.org/ 下载 LTS 版本（>=18）。"
}
if (-not (TestCmd 'npm')) {
    Fail "Node.js 已装但 npm 不可用，请重新安装 Node.js LTS。"
}
$nodeVerRaw = (& node --version).Trim() -replace '^v', ''
$nodeMajor  = [int]($nodeVerRaw.Split('.')[0])
if ($nodeMajor -lt 18) { Fail "Node.js 版本过低：v$nodeVerRaw，需要 >=18。" }
Ok "Node.js v$nodeVerRaw"

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
