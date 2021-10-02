const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const workingDirectory = path.resolve(process.env.GITHUB_WORKSPACE, core.getInput('working-directory'))

    const [analyzeErrorCount, analyzeWarningCount] = await analyze(workingDirectory);
    const formatWarningCount = await format(workingDirectory);

    const issueCount = analyzeErrorCount + analyzeWarningCount + formatWarningCount;
    const failOnWarnings = core.getInput('fail-on-warnings') === 'true';
    const message = `${issueCount} issue${issueCount === 1 ? '' : 's'} found.`;

    if (analyzeErrorCount > 0 || (failOnWarnings && issueCount > 0)) {
      core.setFailed(message);
    } else {
      console.log(message);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function analyze(workingDirectory) {
  let output = '';

  const options = { cwd: workingDirectory };
  options.listeners = {
    stdout: (data) => {
      output += data.toString();
    },
    stderr: (data) => {
      output += data.toString();
    }
  };

  const analysisOptionsFile = core.getInput('analysis-options-file');
  const args = ['--format', 'machine'];

  if (fs.existsSync(path.resolve(workingDirectory, analysisOptionsFile))) {
    args.push('--options');
    args.push(analysisOptionsFile);
  }

  args.push('.');

  await exec.exec('dartanalyzer', args, options);

  let errorCount = 0;
  let warningCount = 0;
  const lines = output.trim().split(/\r?\n/);
  const dataDelimiter = '|';

  for (const line of lines) {
    if (!line.includes(dataDelimiter)) {
      continue;
    }

    const lineData = line.split(dataDelimiter);
    const lint = lineData[2];
    const lintLowerCase = lint.toLowerCase();
    const file = lineData[3].replace(workingDirectory, '');
    const url = lint === lintLowerCase
      ? `https://dart-lang.github.io/linter/lints/${lint}.html`
      : `https://dart.dev/tools/diagnostic-messages#${lintLowerCase}`
    const message = `file=${file},line=${lineData[4]},col=${lineData[5]}::${lineData[7]} For more details, see ${url}`;

    if (lineData[0] === 'ERROR') {
      console.log(`::error ${message}`);
      errorCount++;
    } else {
      console.log(`::warning ${message}`);
      warningCount++;
    }
  }

  return [errorCount, warningCount];
}

async function format(workingDirectory) {
  let output = '';

  const options = { cwd: workingDirectory };
  options.listeners = {
    stdout: (data) => {
      output += data.toString();
    },
    stderr: (data) => {
      output += data.toString();
    }
  };

  const args = ['format', '--output none'];
  const lineLength = core.getInput('line-length');

  if (lineLength) {
    args.push('--line-length');
    args.push(lineLength);
  }

  args.push('.');

  await exec.exec('dart', args, options);
  
  let warningCount = 0;
  const lines = output.trim().split(/\r?\n/);

  for (const line of lines) {
    if (!line.endsWith('.dart')) continue;
    const file = line.substring(8); // Remove the "Changed " prefix

    console.log(`::warning file=${file}::Invalid format. For more details, see https://dart.dev/guides/language/effective-dart/style#formatting`);
    warningCount++;
  }

  return warningCount;
}

run();
