const mongoose = require('mongoose');
const {
  Schema
} = mongoose;

const OpenUserSchema = new Schema({
  genre: {
    type: String,
    required: true
  },
  openId: {
    type: String,
    required: true
  },
  portrait: {
    type: String
  },
  nikeName: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = {
  schema: OpenUserSchema,
  model: mongoose.model('OpenUser', OpenUserSchema)
};