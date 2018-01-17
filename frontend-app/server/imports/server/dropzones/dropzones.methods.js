import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Dropzones } from './dropzones.collections';

Meteor.methods({
  'dropzones.addDropzone'({ id, boxId, items }) {
    new SimpleSchema(Dropzones.schema).validate({ id, boxId, items });
    return Dropzones.insert({ id, boxId, items });
  },
  'dropzones.editDropzone'(dropzoneId, itemObj) {
    return Dropzones.update({ id: dropzoneId }, { $addToSet: { items: itemObj } });
  },
});
