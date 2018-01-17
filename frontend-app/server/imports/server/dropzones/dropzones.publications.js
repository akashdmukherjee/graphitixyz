import { Meteor } from 'meteor/meteor';
import { Dropzones } from './dropzones.collections';

Meteor.publish('dropzones', () => Dropzones.find());
