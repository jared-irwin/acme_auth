const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const { STRING } = Sequelize;
const config = {
  logging: false,
};
const bcrypt = require('bcrypt');

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

const Note = conn.define('note', {
  text: STRING,
});

User.hasMany(Note);
Note.belongsTo(User);

User.beforeCreate((user) => {
  const hash = bcrypt.hashSync(user.password, 5);
  user.password = hash;
  return user;
});

User.byToken = async (token) => {
  const userId = jwt.verify(token, process.env.SECRET_TOKEN).userId;
  console.log('userId from token: ', userId);
  try {
    const user = await User.findByPk(userId);
    if (user) {
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
    },
  });
  const match = await bcrypt.compare(password, user.password);

  if (match) {
    const jwtoken = jwt.sign({ userId: user.id }, process.env.SECRET_TOKEN);
    console.log(jwtoken);
    return jwtoken;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  const notes = [
    { text: 'Note 1', userId: 1 },
    { text: 'Note 2', userId: 2 },
    { text: 'Note 3', userId: 2 },
  ];
  const [one, two, three] = await Promise.all(
    notes.map((note) => Note.create(note))
  );
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note,
  },
};
