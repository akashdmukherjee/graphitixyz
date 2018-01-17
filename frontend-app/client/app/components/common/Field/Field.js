import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const dropDownPositions = {
  left: 'left',
  right: 'right',
};

const Field = props => {
  const {
    text,
    leftIcon,
    rightIcon,
    hasDropdown,
    dropdownLabel,
    dropDownPosition,
    isRightIconText,
    style,
    data,
    transformLeftIconName,
    transformRightIconName,
    onDropdownClick,
    onFieldClick,
  } = props;
  return (
    <div
      styleName="field"
      style={style.field}
      onClick={e => onFieldClick(e, data)}
    >
      {hasDropdown && dropDownPosition === dropDownPositions.left
        ? <div styleName="dropdown-label" onClick={onDropdownClick}>
            {dropdownLabel} <i className="icon-arrow-down" />
          </div>
        : null}
      <div
        styleName={`content ${hasDropdown ? '' : 'no-dropdown'}`}
        style={style.content}
      >
        {leftIcon
          ? <i className={transformLeftIconName(data)} styleName="left-icon" />
          : null}
        {text}
        {rightIcon && !isRightIconText
          ? <i
            className={transformRightIconName(data)}
            styleName="right-icon"
          />
          : null}
        {rightIcon && isRightIconText
          ? <span styleName="right-icon-text">×</span>
          : null}
      </div>
      {hasDropdown && dropDownPosition === dropDownPositions.right
        ? <div
          styleName="dropdown-label"
          onClick={onDropdownClick}
          style={style.dropdown}
        >
            {dropdownLabel} <i className="icon-arrow-down" />
          </div>
        : null}
    </div>
  );
};

Field.propTypes = {
  text: PropTypes.string.isRequired,
  leftIcon: PropTypes.bool,
  rightIcon: PropTypes.bool,
  hasDropdown: PropTypes.bool,
  dropdownLabel: PropTypes.string,
  dropDownPosition: PropTypes.oneOf([
    dropDownPositions.left,
    dropDownPositions.right,
  ]),
  isRightIconText: PropTypes.bool,
  style: PropTypes.shape({
    field: PropTypes.object,
    content: PropTypes.object,
    dropdown: PropTypes.object,
  }),
  data: PropTypes.object,
  transformLeftIconName: PropTypes.func,
  transformRightIconName: PropTypes.func,
  onDropdownClick: PropTypes.func,
  onFieldClick: PropTypes.func,
};

Field.defaultProps = {
  transformLeftIconName: () => 'fa fa-hashtag',
  transformRightIconName: () => 'fa fa-close',
  rightIcon: true,
  leftIcon: true,
  isRightIconText: false,
  hasDropdown: false,
  dropDownPosition: dropDownPositions.left,
  dropdownLabel: '',
  data: null,
  onDropdownClick: () => null,
  onFieldClick: () => null,
  style: {},
};

export default cssModules(Field, styles, { allowMultiple: true });
