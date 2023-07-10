import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('blinkDB', 'root', 'root', {
  host: '0.0.0.0',
  port: 3307,
  dialect: 'mariadb',
});

async function sequelizeCoonnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

export default sequelizeCoonnection;
