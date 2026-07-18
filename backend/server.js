// config.js MUST be the first import: it loads .env and validates required
// secrets before any other module (routers, middlewares, prisma client) runs.
import { PORT } from './src/config.js';
import app from './src/app.js';

app.listen(PORT, () => {
  console.log(`PaperBuddy Backend Server listening on port ${PORT}`);
});