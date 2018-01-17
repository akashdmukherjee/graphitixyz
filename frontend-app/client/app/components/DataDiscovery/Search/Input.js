import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './input.styl';
import Tag from '../Tag';

const Input = (props) => {
  const {
    searchText,
    handleKeyPress,
    enterKeyPressed,
    onTextChange,
    onInputFocus,
    onTagCloseClick,
  } = props;
  const KeywordTags = searchText.trim().split(' ')
    .map(keyword => (
      <Tag
        key={Math.random()}
        label={keyword.trim()}
        onTagCloseClick={onTagCloseClick}
        interactive
      />
    ));

  const View = (
    <div styleName="inp-wrapper">
      <h5>Data Assets</h5>
      {enterKeyPressed ?
        <div
          styleName="inputSplitSearchText-wrapper"
          onClick={onInputFocus}
        >
          {KeywordTags}
        </div> :
        <input
          styleName="inp-search"
          type="text"
          name="searchText"
          placeholder="Search here"
          onKeyPress={handleKeyPress}
          onChange={onTextChange}
          onFocus={onInputFocus}
          value={searchText}
        />
      }
    </div>
  );
  return View;
};

Input.propTypes = {
  searchText: PropTypes.string,
};

Input.defaultProps = {
  searchText: '',
};

export default cssModules(Input, styles);
