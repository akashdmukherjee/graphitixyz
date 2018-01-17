import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import Card, { cardSpacing } from '../Card';
import Asset from '../AssetCard';
import { sidebarWidth } from '../constants';
import List from './List';

class DataTypeLists extends Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.resizeCard = this.resizeCard.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      this.resizeCard('onLoad');
    }, 0);
    window.addEventListener('resize', this.resizeCard, false);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeCard, false);
  }

  resizeCard(resizeType) {
    const element = ReactDOM.findDOMNode(this.listsWrapper);
    let width = (element.clientWidth - sidebarWidth) / 3.235;
    // width = resizeType === 'onLoad' ? width : width + 70; // TODO: debug
    const height = width / 1.19;
    // console.info(width, height);
    this.setState({
      width,
      height,
    });
  }

  render() {
    // TODO: Refactor style
    const {
      assets,
      facet_counts,
    } = this.props;
    let Lists;
    if (assets) {
      Lists = Object.keys(facet_counts).map(facetField => {
        if (facet_counts[facetField] > 0) {
          return (
            <List
              key={Math.random()}
              assetType={facetField}
              facetCount={facet_counts[facetField]}
              width={this.state.width}
              height={this.state.height}
              assets={assets.filter(asset => asset.assetType === facetField)}
            />
          );
        }
      });
    }

    return (
      <div styleName="lists-wrapper" ref={ref => { this.listsWrapper = ref; }}>
        {Lists}
        {/*<div styleName="list">
          <div styleName="list-header">
            <h3>SQL Queries</h3>
            <div styleName="show-all">
              <span>Show All</span>
            </div>
          </div>
          <div styleName="list-body" style={{ height: this.state.height }}>
            <Card width={this.state.width} height={this.state.height}>
              <Asset />
            </Card>
            <Card width={this.state.width} height={this.state.height}>
              <Asset />
            </Card>
            <Card width={this.state.width} height={this.state.height}>
              <Asset />
            </Card>
          </div>
        </div>
        <div styleName="list">
          <div styleName="list-header">
            <h3>Data Assets</h3>
            <div styleName="show-all">
              <span>Show All</span>
            </div>
          </div>
          <div styleName="list-body" style={{ height: this.state.height }}>
            <Card width={this.state.width} height={this.state.height}>
              <Asset />
            </Card>
            <Card width={this.state.width} height={this.state.height}>
              <Asset />
            </Card>
            <Card width={this.state.width} height={this.state.height}>
              <Asset />
            </Card>
          </div>
        </div>*/}
      </div>
    );
  }
}

export default cssModules(DataTypeLists, styles);
