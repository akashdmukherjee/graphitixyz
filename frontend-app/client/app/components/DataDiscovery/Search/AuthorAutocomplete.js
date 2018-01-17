import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './authorAutocomplete.styl';
const iconNames = {
  TEAM: 'fa fa-users',
  USER: 'fa fa-user',
};

const AuthorAutocomplete = ({ show, authorsList, onClick }) => {
  const renderRow = author => (
    <li onClick={() => onClick(author)} key={author.id}>
      <div styleName="icon-wrapper">
        <i className={iconNames[author.type]} />
      </div>
      <div styleName="asset-name">
        {author.name}<br />
        <span>
          {author.email
            ? <h5 styleName="author-label">
                <span styleName="authors">
                  {author.email}
                </span>
              </h5>
            : null}
        </span>
      </div>
    </li>
  );

  if (show && authorsList && authorsList.length) {
    return (
      <ul styleName="autocomplete-wrapper">
        {authorsList.map(author => renderRow(author))}
      </ul>
    );
  }
  return null;
};

AuthorAutocomplete.propTypes = {
  show: PropTypes.bool.isRequired,
  authorsList: PropTypes.array.isRequired,
  onClick: PropTypes.func,
};

export default cssModules(AuthorAutocomplete, styles);
