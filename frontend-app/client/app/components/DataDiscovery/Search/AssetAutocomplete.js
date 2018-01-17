import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './assetAutocomplete.styl';

const iconNames = {
  sql: 'fa fa-code',
  dataset: 'fa fa-th',
};

const composeAuthors = (admin_names, author_names) => {
  let authors = [];
  if (typeof admin_names === 'string') {
    authors.push(admin_names);
  } else if (typeof admin_names === 'object') {
    authors = authors.concat(admin_names);
  }
  if (typeof author_names === 'string') {
    authors.push(author_names);
  } else if (typeof author_names === 'object') {
    authors = authors.concat(author_names);
  }
  return authors;
};

const AssetAutocomplete = ({ assetList, onAssetClick, show }) => {
  const renderRow = asset => (
    <li onClick={onAssetClick} key={asset.assetId}>
      <a href={`/asset/${asset.assetId}`}>
        <div styleName="icon-wrapper">
          <i className={iconNames[asset.assetType.toLowerCase()]} />
        </div>
        <div styleName="asset-name">
          {asset.assetName}<br />
          <span>
            <h5 styleName="author-label">
              Authors:
              <span styleName="authors">
                {composeAuthors(
                  asset.admin_names,
                  asset.author_names
                ).map(author => <span key={Math.random()}>{author},</span>)}
              </span>
            </h5>
          </span>
        </div>
      </a>
    </li>
  );

  const renderAutocompleteList = () => {
    if (show && assetList && assetList.length) {
      return (
        <ul styleName="autocomplete-wrapper">
          {assetList.map(asset => renderRow(asset))}
        </ul>
      );
    }
    return null;
  };
  return renderAutocompleteList();
};

AssetAutocomplete.propTypes = {
  assetList: PropTypes.array.isRequired,
  onAssetClick: PropTypes.func,
};

export default cssModules(AssetAutocomplete, styles);
