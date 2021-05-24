const { syncAndSeed } = require('./db');
const app = require('./app');

const init = async () => {
  await syncAndSeed();
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
  console.log('Did our env variable work: ', process.env.SECRET_TOKEN);
};

init();
