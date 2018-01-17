import { Meteor } from 'meteor/meteor';
import { Slides } from '../slides/slides.collections';
import { Blocks } from '../blocks/blocks.collections';
import { Dropzones } from '../dropzones/dropzones.collections';

Meteor.methods({
  'dev.resetData'() {
    Slides.remove({});
    Blocks.remove({});
    Dropzones.remove({});
  },
});
