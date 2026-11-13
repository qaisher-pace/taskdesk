import { app } from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(
    `TaskDesk API on http://localhost:${config.port} ` +
      `(auth=${config.requireAuth ? 'required' : 'off'}, latency=${config.simulateLatency}, errors=${config.simulateErrors})`,
  );
});
