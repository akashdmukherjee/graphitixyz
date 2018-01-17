import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Types } from './Asset';
import './tabs.css';
import SortBy from './SortBy';
import ContentPlaceholder from '../../common/ContentPlaceholder';
import TabContent from './TabContent';

Tabs.setUseDefaultStyles(false);

const propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool.isRequired,
};

const defaultProps = {
  data: {
    assets: [],
  },
};

const contentPlaceHolders = [
  <ContentPlaceholder />,
  <ContentPlaceholder />,
  <ContentPlaceholder />,
  <ContentPlaceholder />,
  <ContentPlaceholder />,
  <ContentPlaceholder />,
];

const CREATED_DATE = 'Created Date';
const LAST_UPDATED_DATE = 'Last Updated Date';
const sortByStyle = {
  popUpComponent: {
    width: 150,
    top: 30,
    zIndex: 1,
    right: 2,
  },
};

class Assets extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    const { assets } = props.data;
    this.state = {
      ...this.constructAssets(assets),
      lastSelectedIndex: 0,
      sortBy: CREATED_DATE,
      loading: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { data } = nextProps;
    if (data !== this.props.data) {
      setTimeout(() => {
        this.setState(this.constructAssets(data.assets));
      }, 0);
    }
  }

  constructAssets = assets => {
    if (!assets) return [];
    const object = {
      dataset: [],
      sql: [],
      dashboard: [],
      chart: [],
      all: assets,
      loading: false,
    };
    assets.forEach(asset => {
      object[asset.assetType.toLowerCase()].push(asset);
    });
    return object;
  };

  showLoading = () => {
    this.setState({ loading: true });
  };

  hideLoading = () => {
    this.setState({ loading: false });
  };

  toggleLoading = () => {
    this.setState({ loading: !this.state.loading });
  };

  handleSelect = (index, last) => {
    // console.info(index, last);
    this.state.lastSelectedIndex = last;
  };

  handleSortBySelection = data => {
    this.setState({ sortBy: data.text, loading: true });
    this.sortByList.handleTriggerClick();
    this.props.sortByChanged(data.text);
  };

  renderContentPlaceHolder = assetType => {
    const { loading } = this.state;
    const { data, styles, ...restProps } = this.props;
    if (!loading) return <TabContent {...restProps} dataSource={this.state[assetType]} />;
    return contentPlaceHolders;
  };

  renderTabs() {
    const { sortBy } = this.state;
    return (
      <div styleName="assets-list">
        <Tabs onSelect={this.handleSelect} selectedIndex={this.state.lastSelectedIndex}>
          <TabList>
            <Tab>All</Tab>
            <Tab>SQL Assets</Tab>
            <Tab>Dataset Assets</Tab>
            <Tab>Chart Assets</Tab>
          </TabList>
          <TabPanel>
            {this.renderContentPlaceHolder('all')}
          </TabPanel>
          <TabPanel>
            {this.renderContentPlaceHolder(Types.SQL.toLowerCase())}
          </TabPanel>
          <TabPanel>
            {this.renderContentPlaceHolder(Types.DATASET.toLowerCase())}
          </TabPanel>
          <TabPanel>
            {this.renderContentPlaceHolder(Types.CHART.toLowerCase())}
          </TabPanel>
        </Tabs>
        <div styleName="sort-by">
          <SortBy
            ref={_ref => {
              this.sortByList = _ref;
            }}
            label={sortBy}
            dataSource={[CREATED_DATE, LAST_UPDATED_DATE]}
            activeItem={CREATED_DATE}
            styles={sortByStyle}
            onListItemClick={this.handleSortBySelection}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div styleName="assets-container">
        <div styleName="assets-wrapper">
          {this.renderTabs()}
        </div>
      </div>
    );
  }
}

export default cssModules(Assets, styles);
