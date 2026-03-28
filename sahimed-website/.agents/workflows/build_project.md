---
description: Build the HealthLink Pharmacy project
---

This workflow details the steps to install dependencies and compile the production build.

1. Set the Node.js path:
```powershell
$env:PATH = 'C:\node-v25.8.1-win-x64\node-v25.8.1-win-x64;' + $env:PATH
```

// turbo
2. Install dependencies:
```powershell
& 'C:\node-v25.8.1-win-x64\node-v25.8.1-win-x64\npm.cmd' install
```

// turbo
3. Build the project:
```powershell
& 'C:\node-v25.8.1-win-x64\node-v25.8.1-win-x64\npm.cmd' run build
```
