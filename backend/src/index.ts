import { createApp, registerStartupLogging } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.port, () => {
    registerStartupLogging(env.port);
    console.log(`Backend listening on port ${env.port}`);
});
