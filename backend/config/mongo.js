const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

const isMongoReady = () => mongoose.connection.readyState === 1;

module.exports = {
  mongoose,
  isMongoReady,
};
