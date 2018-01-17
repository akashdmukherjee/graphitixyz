import React from 'react';
import './menu.css';

const Styles = {
  arrowRight: {
    position: 'absolute',
    color: '#777777',
    right: 5,
    top: '30%',
    width: 12,
    height: 12,
  },
};

const Menu = (props) => {
  const {
    link,
    onClick,
    children,
    text,
    style,
    seperator,
    textButton,
    fileInput,
    onFileSelect,
  } = props;
  let customStyle;
  if (seperator) {
    customStyle = Object.assign({}, style, { borderBottom: '1px solid rgb(224, 224, 224)' });
  }
  return (
    <li className={textButton ? 'NewAssetMenu btn' : 'NewAssetMenu'}>
      {!fileInput
        ? (
        <a
          href={link}
          onClick={() => onClick(text)}
          className={textButton ? 'NewAssetMenu-link-btn' : 'NewAssetMenu-link'}
          style={customStyle}
        >
          {text}
        </a>
         )
      : (
        <label className="NewAssetMenu-file-input" htmlFor="csv-input">
          {text}
          <input type="file" name="csv-input" id="csv-input" onChange={onFileSelect} />
        </label>
       )}
      {children ? <i className="fa fa-caret-right" style={Styles.arrowRight} /> : null}
      {children}
    </li>
  );
};

Menu.propTypes = {
  link: React.PropTypes.string,
  text: React.PropTypes.string.isRequired,
  style: React.PropTypes.object,
  seperator: React.PropTypes.bool,
  fileInput: React.PropTypes.bool,
  textButton: React.PropTypes.bool,
  children: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.object,
    React.PropTypes.func,
  ]),
  onClick: React.PropTypes.func,
  onFileSelect: React.PropTypes.func,
};

Menu.defaultProps = {
  link: '#',
  seperator: false,
  fileInput: false,
  textButton: false,
  onClick: value => console.info(value),
  onFileSelect: () => {},
  children: null,
  style: null,
};

export default Menu;
