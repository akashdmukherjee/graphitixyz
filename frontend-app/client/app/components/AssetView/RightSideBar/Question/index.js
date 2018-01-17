import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import Collapsible from '../../Collapsible';

const Question = ({ text, answer, onQuestionClick }) => {
  return (
    <Collapsible
      triggerText={text}
      name="question"
      onClick={onQuestionClick}
    >
      <div styleName="qa-wrapper">
        <h5 styleName="answer">{answer}</h5>
      </div>
    </Collapsible>
  );
};

export default cssModules(Question, styles);
