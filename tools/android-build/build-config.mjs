// G21.36 (#592): bounded, task-owned settings for the Windows Android debug
// build. Pure functions only; the CLI (android-build.mjs) does the I/O.
import path from 'node:path';
import { validateBuildRoot } from './scoped-clean.mjs';

export const SUPPORTED_ABIS = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];
export const DEFAULTS = Object.freeze({ maxWorkers: 2, gradleHeap: '3g', abi: 'x86_64', timeoutMinutes: 90 });

export function taskPaths(buildRoot) {
  return {
    gradleHome: path.join(buildRoot, 'gradle-home'),
    tmp: path.join(buildRoot, 'tmp'),
    logs: path.join(buildRoot, 'logs'),
    records: path.join(buildRoot, 'records'),
  };
}

// Returns { options } or { errors }: bad input is reported with a reason,
// never coerced (lessons-learned 3).
export function resolveOptions(raw, { checkoutRoot, env }) {
  const errors = [];
  const buildRoot = raw['build-root'];
  const rootError = validateBuildRoot(buildRoot, checkoutRoot);
  if (rootError) errors.push(rootError);

  const sdk = raw.sdk ?? env.ANDROID_HOME;
  if (!sdk || !path.isAbsolute(sdk)) errors.push('--sdk (or ANDROID_HOME) must be an absolute Android SDK path');
  const jdk = raw.jdk ?? env.KUDY_JDK17;
  if (!jdk || !path.isAbsolute(jdk)) {
    errors.push('--jdk (or KUDY_JDK17) must be an absolute JDK 17 path; the system JAVA_HOME is not used implicitly');
  }

  const maxWorkers = raw['max-workers'] === undefined ? DEFAULTS.maxWorkers : Number(raw['max-workers']);
  if (!Number.isInteger(maxWorkers) || maxWorkers < 1 || maxWorkers > 16) {
    errors.push(`--max-workers must be an integer 1..16, got ${JSON.stringify(raw['max-workers'])}`);
  }
  const gradleHeap = raw['gradle-heap'] ?? DEFAULTS.gradleHeap;
  if (!/^[1-9][0-9]{0,4}[mg]$/.test(gradleHeap)) {
    errors.push(`--gradle-heap must look like 3g or 3072m, got ${JSON.stringify(gradleHeap)}`);
  }
  const abi = raw.abi ?? DEFAULTS.abi;
  const abis = abi.split(',');
  if (abis.some((item) => !SUPPORTED_ABIS.includes(item))) {
    errors.push(`--abi must be a comma list of ${SUPPORTED_ABIS.join(', ')}, got ${JSON.stringify(abi)}`);
  }
  const timeoutMinutes = raw['timeout-minutes'] === undefined ? DEFAULTS.timeoutMinutes : Number(raw['timeout-minutes']);
  if (!Number.isInteger(timeoutMinutes) || timeoutMinutes < 1 || timeoutMinutes > 600) {
    errors.push(`--timeout-minutes must be an integer 1..600, got ${JSON.stringify(raw['timeout-minutes'])}`);
  }
  // The Windows build runs gradlew.bat through cmd.exe; cmd metacharacters in
  // a path would change the command, so they are rejected instead of escaped.
  for (const [name, value] of [['--build-root', buildRoot], ['--sdk', sdk], ['--jdk', jdk]]) {
    if (typeof value === 'string' && /["%&|<>^!]/.test(value)) errors.push(`${name} must not contain cmd metacharacters: ${value}`);
  }
  const roDepCache = raw['ro-dep-cache'];
  if (roDepCache !== undefined && !path.isAbsolute(roDepCache)) {
    errors.push('--ro-dep-cache must be an absolute path to a directory that contains modules-2');
  }
  if (errors.length > 0) return { errors };
  return {
    options: {
      buildRoot: path.resolve(buildRoot), sdk, jdk, maxWorkers, gradleHeap, abi, timeoutMinutes,
      roDepCache, rerunTasks: Boolean(raw['rerun-tasks']),
    },
  };
}

// Gradle splits org.gradle.jvmargs at whitespace unless an argument is in
// double quotes, so a path-bearing argument is always quoted: unquoted, a
// build root such as D:\build root makes the forked build JVM look for the
// main class "root/tmp" [key: unquoted-gradle-tmp-path]. Paths cannot contain
// a double quote (resolveOptions rejects it).
export const jvmArg = (arg) => `"${arg}"`;

// gradle.properties is read as ISO-8859-1: a non-ASCII character in a path is
// written as a \uXXXX escape so the JVM receives the path unchanged. Paths
// here use forward slashes, so the value has no backslash to escape.
export const propertyValue = (value) =>
  value.replace(/[^\x20-\x7e]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`);

// gradle.properties for the task-owned GRADLE_USER_HOME. Properties there
// override the generated android/gradle.properties for every build of the
// composite (app, native modules and the included plugin builds) without
// touching any tracked or global file.
export function gradleUserProperties(options) {
  const tmp = taskPaths(options.buildRoot).tmp.replaceAll('\\', '/');
  const jvmArgs = [`-Xmx${options.gradleHeap}`, '-XX:MaxMetaspaceSize=1g', '-Dfile.encoding=UTF-8', jvmArg(`-Djava.io.tmpdir=${tmp}`)];
  return [
    '# Written by tools/android-build/android-build.mjs (G21.36). Task-owned Gradle home only.',
    // No daemon survives the build, so no idle JVM keeps output files open.
    'org.gradle.daemon=false',
    `org.gradle.workers.max=${options.maxWorkers}`,
    `org.gradle.jvmargs=${propertyValue(jvmArgs.join(' '))}`,
    // Kotlin compiles inside the build JVM instead of a separate compile
    // daemon that outlives a failed build and holds compileKotlin outputs.
    'kotlin.compiler.execution.strategy=in-process',
    `reactNativeArchitectures=${options.abi}`,
    '',
  ].join('\n');
}

export function buildEnv(options, baseEnv) {
  const paths = taskPaths(options.buildRoot);
  const env = { ...baseEnv };
  env.JAVA_HOME = options.jdk;
  env.ANDROID_HOME = options.sdk;
  env.ANDROID_SDK_ROOT = options.sdk;
  env.GRADLE_USER_HOME = paths.gradleHome;
  env.TEMP = paths.tmp;
  env.TMP = paths.tmp;
  if (options.roDepCache) env.GRADLE_RO_DEP_CACHE = options.roDepCache;
  else delete env.GRADLE_RO_DEP_CACHE;
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') ?? 'PATH';
  env[pathKey] = [path.join(options.jdk, 'bin'), path.join(options.sdk, 'platform-tools'), env[pathKey]]
    .filter(Boolean)
    .join(path.delimiter);
  return env;
}

// --gradle-user-home puts the task-owned home on the wrapper client's command
// line too, so classifyProcesses can prove ownership of every build JVM.
export function gradleArgs(options) {
  const args = ['assembleDebug', '--no-daemon', '--console=plain', '--gradle-user-home', taskPaths(options.buildRoot).gradleHome];
  if (options.rerunTasks) args.push('--rerun-tasks');
  return args;
}

// cmd quotes only what whitespace would split; the wrapper's args never
// contain a double quote (resolveOptions rejects cmd metacharacters).
export const quoteForCmd = (arg) => (/[\s]/.test(arg) ? `"${arg}"` : arg);

// The wrapper command as spawn() must receive it. On Windows the name carries
// a path (.\gradlew.bat): a bare `gradlew.bat` leaves resolution to cmd's
// search order, which a host may run with the current directory excluded, so
// the build dies with "'gradlew.bat' is not recognized" before Gradle starts
// [#211]. The separator is written literally so the plan does not depend on
// the host that builds the string.
export function gradleSpawnPlan(options, { platform = process.platform } = {}) {
  const args = gradleArgs(options);
  const command = `${platform === 'win32' ? '.\\gradlew.bat' : './gradlew'} ${args.map(quoteForCmd).join(' ')}`;
  return platform === 'win32'
    ? { file: command, args: [], shell: true, command }
    : { file: './gradlew', args, shell: false, command };
}

// Gradle's own output is never localized, so its presence in the build log —
// not the exit text — proves the wrapper actually started. A log without any
// of these lines (cmd could not execute the wrapper, the JVM never came up)
// marks a host problem, not a build failure [#211].
export function gradleStartedInLog(logText) {
  return /(BUILD (SUCCESSFUL|FAILED)|FAILURE:|^> Task |Welcome to Gradle|Starting a Gradle Daemon)/m.test(logText);
}

// The build step's exit code from its raw outcomes [#211, #234]. Pure so the
// whole decision is unit-testable inside npm test's 60 s test budget: the
// only real-CLI way to reach the timeout branch is a 60 s round-trip
// (--timeout-minutes is whole minutes), which the CI tests job cannot afford.
export function buildExitCode({ exitCode, apkExists, timedOut, spawnError, gradleStarted }) {
  if (spawnError) return 87;
  if (exitCode === 0 && !apkExists) return 1;
  // A timed-out build was alive until the timer fired, so it started: it
  // stays a build failure even when the log has no Gradle signature yet, and
  // the timeout trail lives in the log and the record.
  if (exitCode !== 0 && !timedOut && !gradleStarted) return 87;
  return exitCode;
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A root matches only as a whole path: D:\b must not match D:\b2\x.
function mentions(commandLine, root, caseInsensitive) {
  const variants = new Set([root, root.replaceAll('\\', '/')]);
  return [...variants].some((variant) =>
    new RegExp(`${escapeRegExp(variant)}(?=[\\\\/"'\\s;]|$)`, caseInsensitive ? 'i' : '').test(commandLine));
}

// Gradle clients, Gradle daemons and Kotlin compile daemons are all JVMs. A
// shell or script that merely names the build root (the caller itself) is
// never a build process.
const isBuildProcess = (proc) => /^(java|javaw)(\.exe)?$/i.test(proc.name ?? '');

// owned: a JVM whose command line names the task-owned build root — the only
// processes this tool may stop. foreign: a JVM in this checkout that is not
// ours (another executor) — reported, never stopped. Everything else is
// ignored.
export function classifyProcesses(processes, { buildRoot, checkoutRoot, selfPid, caseInsensitive = process.platform === 'win32' }) {
  const owned = [];
  const foreign = [];
  for (const proc of processes) {
    if (proc.pid === selfPid || typeof proc.commandLine !== 'string' || !isBuildProcess(proc)) continue;
    if (mentions(proc.commandLine, buildRoot, caseInsensitive)) owned.push(proc);
    else if (mentions(proc.commandLine, checkoutRoot, caseInsensitive)) foreign.push(proc);
  }
  return { owned, foreign };
}

