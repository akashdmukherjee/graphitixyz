import React, { Component, PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import ListWrapper from '../../../../common/ListWrapper';
import Row from './Row';

const generateRandomId = () => Math.random().toString().slice(3, 10);
class Explorer extends Component {
  static propTypes = {
    open: PropTypes.bool,
    dataSource: PropTypes.arrayOf(PropTypes.string),
    onClick: PropTypes.func.isRequired,
  };
  static defaultProps = {
    open: false,
    dataSource: [],
  };

  constructor(props) {
    super(props);
    this.state = {
      dataList: this.constructDataList(props.dataSource),
    };
    this.tablesExplorer = null;
  }

  componentWillReceiveProps(nextProps) {
    const { dataSource } = nextProps;
    if (dataSource !== this.props.dataSource) {
      this.setState({ dataList: this.constructDataList(dataSource) });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.dataSource !== nextProps.dataSource) {
      return true;
    }
    return false;
  }

  constructDataList(dataSource) {
    return dataSource.slice(0).map(
      data =>
        typeof data === 'string'
          ? {
            id: generateRandomId(),
            name: data,
            selected: false,
          }
          : { ...data, selected: false }
    );
  }

  render() {
    const { styles, ...listWrapperProps } = this.props;
    return (
      <ListWrapper
        {...listWrapperProps}
        ref={_ref => {
          this.tablesExplorer = _ref;
        }}
      >
        <div styleName="tables-list">
          {this.renderTablesList()}
        </div>
      </ListWrapper>
    );
  }

  renderTablesList() {
    const { dataList } = this.state;
    const { onClick } = this.props;
    return dataList.map((data, index) =>
      <Row key={data.id} data={data} open={index === 0} onClick={onClick} />
    );
  }
}

export default cssModules(Explorer, styles);
