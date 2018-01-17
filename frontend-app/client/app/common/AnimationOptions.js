import React from 'react';
import { animationNames } from './vars';

const AnimationOptions = (props) => {
  const animationOptions = animationNames.map((anim, index) => (
    <option key={index} value={anim}>{anim}</option>
  ));
  return (
    <select onChange={props.handleAnimChange} style={{ width: '100%' }}>
      {animationOptions}
    </select>
  );
};

AnimationOptions.propTypes = {
  handleAnimChange: React.PropTypes.func,
};

export default AnimationOptions;
