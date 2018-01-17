import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './list.styl';

const propTypes = {
  activeItem: PropTypes.string,
  dataSource: PropTypes.arrayOf(PropTypes.string).isRequired,
  onListItemClick: PropTypes.func,
};

const defaultProps = {
  activeItem: null,
  onListItemClick: () => null,
};

class List extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    this.state = {
      dataSource: props.dataSource.map(data => ({
        text: data,
        active: props.activeItem === data,
      })),
    };
  }

  hanldeListItemClick = data => {
    const { onListItemClick } = this.props;
    const dataSource = this.state.dataSource.slice(0);
    const newDataSource = dataSource.map(stateData => ({
      ...stateData,
      active: stateData.text === data.text,
    }));
    onListItemClick(data);
    this.setState({ dataSource: newDataSource });
  };

  render() {
    const { dataSource } = this.state;
    return (
      <ul styleName="list-wrapper">
        {dataSource.map(data => (
          <li
            onClick={() => this.hanldeListItemClick(data)}
            styleName={data.active ? 'list-item-active' : 'list-item'}
          >
            {data.text}
          </li>
        ))}
      </ul>
    );
  }
}

export default cssModules(List, styles);
