const _ = require('lodash');

const config = {
  // MongoDB connection options
  mongo: {
    options: {
      useNewUrlParser: true
    }
  },
};

module.exports = _.merge(
  config,
  require('./' + process.env.NODE_ENV + '.js') || {}
);
