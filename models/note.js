const mongoose = require('mongoose');
const {
  Schema
} = mongoose;

const NoteSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    required: false
  },
  content: {
    type: String,
    required: false
  },
  previewContent: {
    type: String
  },
  file: {
    type: String
  },
  createId: {
    type: String,
    required: false
  },
  modifyTime: {
    type: Date
  },
  status: {
    type: Number
  },
  openId: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = {
  schema: NoteSchema,
  model: mongoose.model('Note', NoteSchema)
};