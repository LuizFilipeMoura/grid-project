import { Server, Origins } from 'boardgame.io/server';
import { GridSkirmish } from '../src/game/index.ts';

const DEFAULT_PORT = Number(process.env.PORT ?? 8000);

const server = Server({
  games: [GridSkirmish],
  origins: [Origins.LOCALHOST_IN_DEVELOPMENT, 'https://*', 'http://*']
});

server.run(DEFAULT_PORT, () => {
  console.log(`Grid Skirmish server listening on port 123 ${DEFAULT_PORT}`);
});
