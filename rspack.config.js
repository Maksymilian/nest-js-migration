// The Nest CLI's Rspack configuration, for both services: next to each service's main.js, it builds
// instrumentation.js, the OpenTelemetry setup that `node --import` loads before the service
// (libs/telemetry/src/instrumentation.ts, and the start scripts in package.json). It also writes
// the build's git version into it (BUILD_VERSION), the service.version a deployment doesn't name.
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { rspack } from '@rspack/core';

/** The commit, as `git describe` names it (a tag when there is one), `-dirty` with uncommitted changes. */
function gitVersion() {
  try {
    const describe = ['describe', '--tags', '--always', '--dirty'];
    return execFileSync('git', describe, { cwd: import.meta.dirname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'unknown'; // no git, or no repository (a build from an archive)
  }
}

export default (options) => ({
  ...options,
  entry: {
    main: options.entry,
    instrumentation: join(import.meta.dirname, 'libs/telemetry/src/instrumentation.ts'),
  },
  output: { ...options.output, filename: join(dirname(options.output.filename), '[name].js') },
  plugins: [...(options.plugins ?? []), new rspack.DefinePlugin({ BUILD_VERSION: JSON.stringify(gitVersion()) })],
});
