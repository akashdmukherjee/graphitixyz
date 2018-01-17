import React from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const Tag = props => {
  const {
    label,
    interactive,
    onTagClick,
    onTagCloseClick,
    labelColor,
    gptRed,
    active,
    style,
    data,
  } = props;

  let styleName = gptRed ? 'tag-wrapper-gpt' : 'tag-wrapper';
  if (active) {
    styleName += '-active';
  }
  return (
    <div
      styleName={styleName}
      onClick={event => {
        onTagClick(event, data || label);
      }}
      style={style.tagWrapper}
    >
      <span styleName="tag-label" style={{ color: labelColor, ...style.label }}>
        {label}
      </span>
      {interactive
        ? <span
          styleName="tag-close"
          onClick={event => {
            event.nativeEvent.stopImmediatePropagation();
            onTagCloseClick(data || label);
          }}
          style={style.close}
        >
            ×
          </span>
        : null}
    </div>
  );
};

Tag.propTypes = {
  label: React.PropTypes.string.isRequired,
  style: React.PropTypes.object,
  interactive: React.PropTypes.bool,
  onTagClick: React.PropTypes.func,
  onTagCloseClick: React.PropTypes.func,
  gptRed: React.PropTypes.bool,
  active: React.PropTypes.bool,
  labelColor: React.PropTypes.string,
  data: React.PropTypes.object,
};

Tag.defaultProps = {
  interactive: true,
  gptRed: false,
  active: false,
  labelColor: '#5d5d5d',
  style: {},
  onTagClick: () => null,
  onTagCloseClick: () => null,
};

export default cssModules(Tag, styles, { allowMultiple: true });
