import React from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const Tag = (props) => {
  const {
    label,
    interactive,
    onTagClick,
    onTagCloseClick,
    style,
    gptRed,
    active,
    data,
  } = props;

  let styleName = gptRed ? 'tag-wrapper-gpt' : 'tag-wrapper';
  if (active) {
    styleName += '-active';
  }
  return (
    <div
      styleName={styleName}
      onClick={(event) => {
        event.nativeEvent.stopImmediatePropagation();
        onTagClick(data || label);
      }}
    >
      <span styleName="tag-label" style={style}>{label}</span>
      {interactive ?
        <span
          styleName="tag-close"
          onClick={(event) => {
            event.nativeEvent.stopImmediatePropagation();
            onTagCloseClick(data || label);
          }}
        >x</span> :
        null
      }
    </div>
  );
};

Tag.defaultProps = {
  interactive: true,
  gptRed: false,
  active: false,
};

Tag.propTypes = {
  label: React.PropTypes.string.isRequired,
  interactive: React.PropTypes.bool,
  onTagClick: React.PropTypes.func,
  onTagCloseClick: React.PropTypes.func,
  gptRed: React.PropTypes.bool,
  active: React.PropTypes.bool,
  style: React.PropTypes.object,
  data: React.PropTypes.object,
};

export default cssModules(Tag, styles);
