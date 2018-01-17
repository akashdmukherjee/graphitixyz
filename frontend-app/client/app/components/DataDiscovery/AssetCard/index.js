import React from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import Tag from '../Tag';

const Asset = (props) => {
  const {
    assetName,
    dataColumns,
    author_names,
  } = props;

  const columnNames = dataColumns ? dataColumns.join(', ') : '';
  const authors = author_names ? author_names.join(', ') : '';

  return (
    <div styleName="asset-wrapper">
      <div styleName="asset-header">
        <div styleName="asset-spacing">
          <i className="fa fa-2x fa-table"></i>
          <span><i className="fa fa-refresh"></i> 4 hours ago</span>
        </div>
      </div>
      <div styleName="asset-body">
        <div>
          <h4 styleName="asset-body-header">{assetName}</h4>
        </div>
        <div styleName="asset-body-preview-row">
          <h5 styleName="preview-header">{columnNames}</h5>
        </div>
        <div styleName="asset-body-footer-column">
          <div styleName="authors">
            <span styleName="authors-label">Authors: </span>
            {authors}
          </div>
        </div>
      </div>
      <div styleName="asset-footer">
        <span className="nav">
          <i className="fa fa-caret-left" styleName="square-icon"></i>
          <i className="fa fa-caret-right" styleName="square-icon"></i>
        </span>
        <span className="actions">
          <i className="fa fa-star" styleName="circle-icon"></i>
          <i className="fa fa-share" styleName="circle-icon"></i>
          <i className="fa fa-share" styleName="circle-icon"></i>
          <i className="fa fa-share" styleName="circle-icon"></i>
        </span>
      </div>
    </div>
  );
};

Asset.defaultProps = {
  assetName: 'How is China\'s hardware sales doing?',
  columnNames: 'id, name, gender, city, state',
  authors: 'Akash, Geetish',
  Tags: null,
};

export default cssModules(Asset, styles);
