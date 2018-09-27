const mongoose = require('mongoose');
const {
  Schema
} = mongoose;
const { schema: OpenUserSchema } = require('./openUser');

const UserSchema = new Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
    index: {
      unique: true,
      dropDups: true
    },
    required: true
  },
  nikeName: {
    type: String
  },
  password: {
    type: String
  },
  portrait: {
    type: String
  },
  loginAt: {
    type: Date
  },
  createAt: Date,
  openUser: [ OpenUserSchema ],
});

module.exports = {
  schema: UserSchema,
  model: mongoose.model('User', UserSchema)
};