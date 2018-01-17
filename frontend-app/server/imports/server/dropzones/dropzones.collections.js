import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Dropzones = new Mongo.Collection('Dropzones');

Dropzones.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Dropzones.schema = new SimpleSchema({
  id: { type: String },
  boxId: { type: String },
  items: { type: [Object] },
  'items.$.name': { type: String },
});

Dropzones.attachSchema(Dropzones.schema);
