import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Blocks } from './blocks.collections';

Meteor.methods({
  'blocks.addBlock'({ id, top, left, anim, width, height, visible, zIndex, slideId }) {
    new SimpleSchema(Blocks.schema).validate({
      id,
      top,
      left,
      anim,
      width,
      height,
      visible,
      zIndex,
      slideId,
    });
    return Blocks.insert({ id, top, left, anim, width, height, visible, zIndex, slideId });
  },
  'blocks.editBlock'(blockObj) {
    return Blocks.update({ id: blockObj.id }, { $set: blockObj });
  },
});
