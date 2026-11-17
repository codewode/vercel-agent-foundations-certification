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

export async function runSandboxCommand(command: string): Promise<ExecResult> {
  const sandbox = await getAdminSandbox();
  if (sandbox) {
    try {
      const result = await sandbox.runCommand(command);
      const stdout = await result.stdout();
      const stderr = await result.stderr();
      return {
        stdout: stdout ?? "",
        stderr: stderr ?? "",
        exitCode: result.exitCode ?? 0,
      };
    } catch (err) {
      console.error("[Sandbox] runCommand failed on remote sandbox:", err);
      return {
        stdout: "",
        stderr: err instanceof Error ? err.message : String(err),
        exitCode: 1,
      };
    }
  }

  // Fallback to local execution environment
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 15_000,
      maxBuffer: 1024 * 1024 * 5,
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
