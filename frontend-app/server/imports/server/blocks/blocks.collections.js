import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Blocks = new Mongo.Collection('Blocks');

Blocks.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Blocks.schema = new SimpleSchema({
  id: { type: String },
  top: { type: Number, defaultValue: 0 },
  left: { type: Number, defaultValue: 0 },
  anim: { type: String, defaultValue: '', optional: true },
  width: { type: Number },
  height: { type: Number },
  visible: { type: Boolean, defaultValue: true },
  zIndex: { type: Number, defaultValue: 10 },
  slideId: { type: String },
});
