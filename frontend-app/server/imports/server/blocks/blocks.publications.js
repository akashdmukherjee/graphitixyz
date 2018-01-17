import { Meteor } from 'meteor/meteor';
import { Blocks } from './blocks.collections';

Meteor.publish('blocks', () => Blocks.find());
