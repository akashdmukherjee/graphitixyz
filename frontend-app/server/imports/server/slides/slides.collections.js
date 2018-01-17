import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Slides = new Mongo.Collection('Slides');

Slides.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Slides.schema = new SimpleSchema({
  name: { type: String },
  active: { type: Boolean },
  visible: { type: Boolean },
  layers: { type: [Object] },
  'layers.$.name': { type: String },
});

Slides.attachSchema(Slides.schema);
