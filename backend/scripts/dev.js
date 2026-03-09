import http from "node:http";
import { spawn, spawnSync } from "node:child_process";

const PORT = Number(process.env.PORT || 4000);

function isHealthy(port) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: "127.0.0.1",
        port,
        path: "/health",
        timeout: 1500,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

function hasPortListener(port) {
  const cmd = `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' } | Measure-Object | Select-Object -ExpandProperty Count`;
  const result = spawnSync("powershell", ["-NoProfile", "-Command", cmd], {
    encoding: "utf8",
  });

  const out = String(result.stdout || "").trim();
  const count = Number(out);
  return Number.isFinite(count) && count > 0;
}

async function main() {
  const healthy = await isHealthy(PORT);

  if (healthy) {
    console.log(`Backend already running on :${PORT} (healthy). Reusing existing process.`);
    process.exit(0);
    return;
  }

  if (hasPortListener(PORT)) {
    console.error(`Port ${PORT} is already in use by another process.`);
    console.error("Stop the process using this port, then run npm run dev again.");
    process.exit(1);
    return;
  }

  const child = spawn(process.execPath, ["--watch", "src/server.js"], {
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}

main();
