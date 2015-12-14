var mongoose = require('mongoose'),
    moment = require('moment'),
    Schema = mongoose.Schema;

var schema = new Schema({
  user_id: {type: String, required: true, trim: true},
  title: {type: String, required: true, trim: true},
  content: {type: String, required: true, trim: true},
  numQuestion: {type: Number, default: 0},
  numAnswer: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});

var Todo = mongoose.model('Todo', schema);

module.exports = Todo;
