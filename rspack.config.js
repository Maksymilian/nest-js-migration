// The Nest CLI's Rspack configuration, for both services: next to each service's main.js, it builds
// instrumentation.js, the OpenTelemetry setup that `node --import` loads before the service
// (libs/telemetry/src/instrumentation.ts, and the start scripts in package.json).
import { dirname, join } from 'node:path';

export default (options) => ({
  ...options,
  entry: {
    main: options.entry,
    instrumentation: join(import.meta.dirname, 'libs/telemetry/src/instrumentation.ts'),
  },
  output: { ...options.output, filename: join(dirname(options.output.filename), '[name].js') },
});
