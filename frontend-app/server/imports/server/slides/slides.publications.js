import { Meteor } from 'meteor/meteor';
import { Slides } from './slides.collections';

Meteor.publish('slides', () => Slides.find());
