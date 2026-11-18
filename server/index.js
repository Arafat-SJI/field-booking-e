import express from 'express';
import 'dotenv/config';
import * as auth from './routes/auth/index.js';

const app = express();
app.use(express.json());
const port = Number(process.env.PORT || 4000);

async function main() {
  await auth.init?.();
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
