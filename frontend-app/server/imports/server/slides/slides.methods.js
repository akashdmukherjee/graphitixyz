import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Slides } from './slides.collections';

Meteor.methods({
  'slides.addSlide'({ name, active, visible, layers }) {
    new SimpleSchema(Slides.schema).validate({
      name,
      active,
      visible,
      layers,
    });
    return Slides.insert({ name, active, visible, layers });
  },
  'slides.addMenuLayer'({ slideName, layerObj }) {
    new SimpleSchema({
      slideName: { type: String },
      layerObj: { type: Object },
      'layerObj.name': { type: String },
    }).validate({ slideName, layerObj });
    return Slides.update({ name: slideName }, { $addToSet: { layers: layerObj } });
  },
  'slides.getSlides'() {
    return Slides.find().fetch();
  },
});
