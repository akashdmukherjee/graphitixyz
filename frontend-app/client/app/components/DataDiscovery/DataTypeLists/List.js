import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import Card from '../Card';
import Asset from '../AssetCard';
import { maxNumberOfAssetsPerRow } from '../constants';

const List = (props) => {
  const {
    assetType,
    facetCount,
    width,
    height,
    assets,
  } = props;
  return (
    <div styleName="list">
      <div styleName="list-header">
        <h3>{assetType}</h3>
        {facetCount <= maxNumberOfAssetsPerRow ? null : <div styleName="show-all">
          <span>Show All {facetCount}</span>
        </div>
        }
      </div>
      <div styleName={assets.length < 3 ? 'list-body-single' : 'list-body'} style={{ height }}>
        {assets.map(asset => (
          <Card key={asset.assetId} width={width} height={height}>
            <Asset {...asset} />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default cssModules(List, styles);
