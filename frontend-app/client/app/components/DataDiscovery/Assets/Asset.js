import React from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { browserHistory } from 'react-router';
import cssModules from 'react-css-modules';
import Tag from '../../common/Tag';
import Button from '../../common/Button';
import UserPermissions from '../../common/UserPermissions';
import styles from './asset.styl';
const users = {
  admins: [
    {
      name: 'Akash',
      image: 'akash',
    },
    {
      name: 'Geetish',
    },
    {
      name: 'Dev',
      image: 'devajit',
    },
    {
      name: 'Tom',
    },
    {
      name: 'Thumb',
    },
    {
      name: 'Tom',
    },
    {
      name: 'Thumb',
    },
  ],
  authors: [
    {
      name: 'Akash',
    },
    {
      name: 'Geetish',
      image: 'geetish',
    },
    {
      name: 'Dev',
      image: 'devajit',
    },
    {
      name: 'Akash',
    },
    {
      name: 'Geetish',
    },
    {
      name: 'Dev',
    },
    {
      name: 'Tom',
    },
    {
      name: 'Thumb',
    },
    {
      name: 'Thumb',
    },
    {
      name: 'Thumb',
    },
    {
      name: 'Thumb',
    },
  ],
  viewers: [
    {
      name: 'Akash',
      image: 'akash',
    },
    {
      name: 'Geetish',
      image: 'geetish',
    },
    {
      name: 'Dev',
    },
    {
      name: 'Akash',
    },
    {
      name: 'Geetish',
    },
    {
      name: 'Dev',
    },
    {
      name: 'Tom',
    },
    {
      name: 'Thumb',
    },
    {
      name: 'Tom',
    },
    {
      name: 'Thumb',
    },
    {
      name: 'Tom',
    },
    {
      name: 'Thumb',
    },
  ],
};

export const Types = {
  SQL: 'SQL',
  DATASET: 'DATASET',
  CHART: 'CHART',
  DASHBOARD: 'DASHBOARD',
  USER: 'USER',
  TEAM: 'TEAM',
};

const icons = {
  SQL: '/images/sqlscript.png',
  DASHBOARD: '/images/dashboard.png',
  DATASET: '/images/dataset.png',
};

const endorsementImages = {
  trusted: {
    active: '/images/Trust.png',
    normal: '/images/Trust_Grey.png',
  },
  erroneous: {
    active: '/images/Error.png',
    normal: '/images/Error_Grey.png',
  },
  deprecate: {
    active: '/images/Deprecate.png',
    normal: '/images/Deprecate_Grey.png',
  },
};

const propTypes = {
  userData: PropTypes.object.isRequired,
  assetName: PropTypes.string.isRequired,
  assetId: PropTypes.string.isRequired,
  assetType: PropTypes.string.isRequired,
  asset_description: PropTypes.string,
  style: PropTypes.object,
};

const defaultProps = {
  asset_description: null,
  style: {},
};

class Asset extends React.Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    this.state = {
      isFavorite: this.isFavorited(),
      shareAsset: false,
    };
  }

  isFavorited() {
    const { is_favorited_ids, userData } = this.props;
    if (!is_favorited_ids) return false;

    if (typeof is_favorited_ids === 'string') {
      if (is_favorited_ids === userData.memberId) return true;
      return false;
    }
    return is_favorited_ids.findIndex(id => id === userData.memberId) !== -1;
  }

  handleFavoriteClick = e => {
    const { addAssetFavorite, deleteAssetFavorite, assetId, userData } = this.props;
    const data = { ...userData, assetId };
    if (this.state.isFavorite) {
      deleteAssetFavorite(data);
    } else {
      addAssetFavorite(data);
    }
    e.stopPropagation();
    this.setState({ isFavorite: !this.state.isFavorite });
  };

  handleShareClick = e => {
    e.stopPropagation();
    this.focusAndSelectShareUrlInput();
    // console.info(top, left);
    this.setState({ shareAsset: !this.state.shareAsset });
  };

  handleAssetClick = () => {
    const { assetId } = this.props;
    browserHistory.push(`asset/${assetId}`);
  };

  focusAndSelectShareUrlInput = copy => {
    setTimeout(() => {
      this.inputShareUrl.focus();
      this.inputShareUrl.select();
      copy && document.execCommand('copy');
    }, 0);
  };

  onCopyClick = () => {
    this.focusAndSelectShareUrlInput(true);
    this.setState({ shareAsset: false });
  };

  handleTagClick = (e, data) => {
    e.stopPropagation();
    console.info('Tag:', data);
  };

  render() {
    const { assetName, assetType, asset_description, style } = this.props;
    let customStyle = {};
    if (style) {
      customStyle = Object.assign(customStyle, style);
    }
    return (
      <li styleName="asset" style={customStyle}>
        <div onClick={this.handleAssetClick}>
          <div styleName="icon">
            <div styleName={`asset-icon-${assetType.toLowerCase()}`} role="presentation" />
          </div>
          <div styleName="asset-details">
            <h5 styleName="asset-name">
              {assetName}
            </h5>
            <h5 styleName="asset-description">
              {asset_description || 'No description'}
            </h5>
            <div styleName="asset-footer">
              {this.renderTags()}
              <UserPermissions
                label="Authors"
                users={this.constructAuthorsArray()}
                showPlus={false}
                style={{
                  user: {
                    width: 26,
                    height: 26,
                    lineHeight: 2,
                  },
                  moreLabel: {
                    fontSize: 11,
                  },
                }}
              />
              <div styleName="asset-infos">
                {this.renderAssetButtons()}
                {this.renderAssetEndorsements()}
              </div>
            </div>
          </div>
        </div>
      </li>
    );
  }

  renderTags = () => {
    const { tags } = this.props;
    if (!tags) return <div />;
    let tagsArray = [];
    // handle Jackson's SINGLE_VALUE_AS_ARRAY error
    if (typeof tags === 'string') {
      tagsArray.push(tags);
    } else {
      tagsArray = [...tagsArray, ...tags];
    }
    return (
      <div styleName="tags">
        {tagsArray.map(tag =>
          <div styleName="tag">
            <Tag key={tag} label={tag} interactive={false} onTagClick={this.handleTagClick} />
          </div>
        )}
      </div>
    );
  };

  renderAssetButtons = () => {
    const { isFavorite } = this.state;
    const { assetId } = this.props;
    return (
      <div styleName="asset-btns">
        <div
          styleName="share-wrapper"
          ref={_ref => {
            this.shareDialog = _ref;
          }}
          onClick={e => e.stopPropagation()}
        >
          <Button styleClassName="btn-no-text" onClick={this.handleShareClick}>
            <i className="fa fa-share" />
          </Button>
          <div styleName={this.state.shareAsset ? 'share-dialog' : 'share-dialog-hide'}>
            <div styleName="invite">
              <h5>
                <i className="icon-plus" /> Invite team members
              </h5>
            </div>
            <div styleName="inputs-wrapper">
              <input
                ref={ref => {
                  this.inputShareUrl = ref;
                }}
                type="text"
                value={`http://graphiti.xyz/asset/${assetId}`}
                readOnly // change this later
              />
              <Button
                styleClassName="btn-copy"
                text="Copy To Clipboard"
                data-tip
                data-for="copy"
                onClick={this.onCopyClick}
              />
            </div>
            <div>
              <h5>
                <i className="fa fa-lock" /> Private only visible to members
              </h5>
            </div>
          </div>
        </div>
        <Button
          styleClassName={`${isFavorite ? 'btn-fav-active' : 'btn-fav'}`}
          text="Favorite"
          onClick={this.handleFavoriteClick}
        >
          <i className="fa fa-star" />
        </Button>
      </div>
    );
  };

  renderAssetEndorsements = () => {
    const { trusted_ids, erroneous_ids, deprecated_ids } = this.props;
    let trustedCount = 0;
    let erroneousCount = 0;
    let deprecatedCount = 0;
    if (trusted_ids) {
      if (typeof trusted_ids === 'string') {
        trustedCount = 1;
      } else {
        trustedCount = trusted_ids.length;
      }
    }
    if (erroneous_ids) {
      if (typeof erroneous_ids === 'string') {
        erroneousCount = 1;
      } else {
        erroneousCount = erroneous_ids.length;
      }
    }
    if (deprecated_ids) {
      if (typeof deprecated_ids === 'string') {
        deprecatedCount = 1;
      } else {
        deprecatedCount = deprecated_ids.length;
      }
    }
    return (
      <div styleName="asset-endorsements">
        <div styleName="endorsement">
          <img
            src={trustedCount ? endorsementImages.trusted.active : endorsementImages.trusted.normal}
            role="presentation"
          />
          <div styleName={trustedCount ? 'count-trust-active' : 'count'}>
            {trustedCount}
          </div>
        </div>
        <div styleName="endorsement">
          <img
            src={
              erroneousCount
                ? endorsementImages.erroneous.active
                : endorsementImages.erroneous.normal
            }
            role="presentation"
          />
          <div styleName={erroneousCount ? 'count-error-active' : 'count'}>
            {erroneousCount}
          </div>
        </div>
        <div styleName="endorsement">
          <img
            src={
              deprecatedCount
                ? endorsementImages.deprecate.active
                : endorsementImages.deprecate.normal
            }
            role="presentation"
          />
          <div styleName={deprecatedCount ? 'count-deprecate-active' : 'count'}>
            {deprecatedCount}
          </div>
        </div>
      </div>
    );
  };

  constructAuthorsArray = () => {
    const { admin_ids, author_ids, admin_names, author_names } = this.props;
    let authors;
    let admins;
    if (typeof admin_names === 'string') {
      admins = {
        name: admin_names,
        id: admin_ids,
      };
    } else {
      admins = admin_names.map((name, index) => ({
        name,
        id: admin_ids[index],
      }));
    }
    if (typeof author_names === 'string') {
      authors = {
        name: author_names,
        id: author_ids,
      };
    } else {
      authors = author_names.map((name, index) => ({
        name,
        id: author_ids[index],
      }));
    }
    return [...authors, ...admins];
  };
}

Asset.propTypes = {
  assetName: PropTypes.string.isRequired,
  assetId: PropTypes.string.isRequired,
  assetType: PropTypes.string.isRequired,
  asset_description: PropTypes.string,
  admin_ids: PropTypes.arrayOf(PropTypes.string),
  author_ids: PropTypes.arrayOf(PropTypes.string),
  admin_names: PropTypes.arrayOf(PropTypes.string),
  author_names: PropTypes.arrayOf(PropTypes.string),
  tags: PropTypes.arrayOf(PropTypes.string),
  style: PropTypes.object,
};

Asset.defaultProps = {
  admin_ids: [],
  admin_names: [],
  author_ids: [],
  author_names: [],
};

export default cssModules(Asset, styles);
