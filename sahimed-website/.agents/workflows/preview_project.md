---
description: Preview the HealthLink Pharmacy project locally
---

This workflow details the steps to start the development server and preview the app.

1. Set the Node.js path:
```powershell
$env:PATH = 'C:\node-v25.8.1-win-x64\node-v25.8.1-win-x64;' + $env:PATH
```

// turbo
2. Start the development server:
```powershell
& 'C:\node-v25.8.1-win-x64\node-v25.8.1-win-x64\npm.cmd' run dev -- --port 3000
```

3. Open the browser to:
[http://localhost:3000](http://localhost:3000)
