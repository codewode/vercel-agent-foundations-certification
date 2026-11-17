import { Sandbox } from "@vercel/sandbox";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const execAsync = promisify(exec);
const MEMORY_FILE_PATH = "/tmp/admin_memory.txt";
const LOCAL_MEMORY_FILE = path.join(process.cwd(), ".admin-memory.txt");

let cachedSandbox: Sandbox | null = null;

async function getAdminSandbox(): Promise<Sandbox | null> {
  if (cachedSandbox) return cachedSandbox;
  try {
    const sandbox = await Sandbox.getOrCreate({
      name: "ship-it-shop-admin-sandbox",
      timeout: 300_000,
    });
    cachedSandbox = sandbox;
    return sandbox;
  } catch (err) {
    console.warn("[Sandbox] Could not connect to Vercel Sandbox SDK, using fallback environment:", err);
    return null;
  }
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

function normalizeExecution(rawCommand: string): {
  cmd: string;
  args: string[];
  shellCommand: string;
} {
  const trimmed = rawCommand.trim();

  // 1. Explicit shell executable / binary
  const knownExecutables =
    /^(python3?|node|bash|sh|echo|cat|ls|curl|grep|awk|sed|find|npm|pnpm|git|mkdir|rm|touch|chmod|which|whoami|pwd|env|head|tail|sort|uniq|wc)\b/i;

  if (knownExecutables.test(trimmed)) {
    return { cmd: "bash", args: ["-c", trimmed], shellCommand: trimmed };
  }

  // 2. JavaScript / TypeScript code
  const isJavaScript =
    /^(const\s+|let\s+|var\s+|console\.log|function\s+|class\s+|import\s+.*from|export\s+)/.test(
      trimmed,
    );

  if (isJavaScript) {
    return {
      cmd: "node",
      args: ["-e", trimmed],
      shellCommand: `node -e ${JSON.stringify(trimmed)}`,
    };
  }

  // 3. Python code detection (e.g. `returns = {...}`, `import json`, `def ...`, dict comprehensions)
  const isPython =
    /(^|\n)\s*(import\s+|def\s+|class\s+|from\s+|print\(|[a-zA-Z_]\w*\s*=\s*[\{\[\(\d"'])|\bfor\b.*\bin\b.*:|\bif\b.*:/m.test(
      trimmed,
    ) || /\{.*:.*for.*in.*\}/.test(trimmed);

  if (isPython) {
    const lines = trimmed.split("\n");
    const lastLineIdx = lines.findLastIndex((l) => l.trim().length > 0);
    if (lastLineIdx !== -1) {
      const lastLine = lines[lastLineIdx].trim();
      if (
        !lastLine.startsWith("print(") &&
        !lastLine.includes("=") &&
        !lastLine.endsWith(":") &&
        !lastLine.startsWith("import ") &&
        !lastLine.startsWith("return ")
      ) {
        lines[lastLineIdx] = `import pprint; pprint.pprint(${lastLine})`;
      }
    }
    const script = lines.join("\n");
    return {
      cmd: "python3",
      args: ["-c", script],
      shellCommand: `python3 -c ${JSON.stringify(script)}`,
    };
  }

  // Default to bash
  return { cmd: "bash", args: ["-c", trimmed], shellCommand: trimmed };
}

export async function runSandboxCommand(command: string): Promise<ExecResult> {
  const { cmd, args, shellCommand } = normalizeExecution(command);
  const sandbox = await getAdminSandbox();

  if (sandbox) {
    try {
      const result = await sandbox.runCommand(cmd, args);
      const stdout = await result.stdout();
      const stderr = await result.stderr();
      return {
        stdout: stdout ?? "",
        stderr: stderr ?? "",
        exitCode: result.exitCode ?? 0,
      };
    } catch (err) {
      console.warn("[Sandbox] Remote runCommand failed, using local runner:", err);
      // Fall through to local fallback
    }
  }

  // Fallback to local execution environment with bash shell
  try {
    const { stdout, stderr } = await execAsync(shellCommand, {
      shell: "/bin/bash",
      timeout: 30_000,
      maxBuffer: 1024 * 1024 * 10,
    });
    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
    };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; code?: number; message?: string };
    return {
      stdout: error.stdout?.trim() ?? "",
      stderr: (error.stderr || error.message || String(err)).trim(),
      exitCode: error.code ?? 1,
    };
  }
}

export async function readSandboxMemory(): Promise<string> {
  const sandbox = await getAdminSandbox();
  if (sandbox) {
    try {
      const content = await sandbox.readFile({ path: MEMORY_FILE_PATH });
      if (content) return content.toString();
    } catch {
      // Memory file may not exist yet
    }
  }

  try {
    const content = await fs.readFile(LOCAL_MEMORY_FILE, "utf-8");
    return content;
  } catch {
    return "";
  }
}

export async function saveSandboxMemory(content: string): Promise<void> {
  const sandbox = await getAdminSandbox();
  if (sandbox) {
    try {
      await sandbox.writeFiles([{ path: MEMORY_FILE_PATH, content }]);
    } catch (err) {
      console.warn("[Sandbox] Failed to save memory to remote sandbox:", err);
    }
  }

  try {
    await fs.writeFile(LOCAL_MEMORY_FILE, content, "utf-8");
  } catch (err) {
    console.error("[Sandbox] Failed to save memory locally:", err);
  }
}
