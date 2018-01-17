import React, { Component } from 'react';
import EditablePopUpComponent from '../../../../common/EditablePopUpComponent';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './popUpComponent.styl';

const sourceOptions = {
  GRAPHITI: 'GRAPHITI',
  EXTERNAL: 'EXTERNAL',
};

const propTypes = {
  activeSource: PropTypes.string,
  isNewAsset: PropTypes.bool.isRequired,
  dataSource: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSourceSelection: PropTypes.func.isRequired,
};

const defaultProps = {
  activeSource: null,
};

class PopUpComponent extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    this.state = {
      selectedOption: null,
      dataSource: props.dataSource,
      activeSource: props.activeSource,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { dataSource, activeSource } = nextProps;
    if (dataSource !== this.props.dataSource) {
      this.setState({ dataSource });
    }
    if (activeSource !== this.props.activeSource) {
      this.setState({ activeSource });
    }
  }

  handleSourceSelection = selectedOption => {
    this.setState({ selectedOption });
    if (selectedOption === sourceOptions.GRAPHITI) {
      this.props.onSourceSelection(selectedOption);
    }
  };

  render() {
    const { selectedOption, dataSource, activeSource } = this.state;
    const { styles, dataSource: propsDataSource, ...editablePopUpComponentProps } = this.props;
    const isExternalSourceActive =
      selectedOption === sourceOptions.EXTERNAL || activeSource === sourceOptions.EXTERNAL;
    const isGraphitiSourceActive =
      selectedOption === sourceOptions.GRAPHITI || activeSource === sourceOptions.GRAPHITI;
    const isNewAsset = this.props.isNewAsset;
    return (
      <div styleName="PopUpComponent">
        <ul styleName="sources">
          {!isNewAsset && !isGraphitiSourceActive
            ? null
            : <li
              styleName={`list-item${isGraphitiSourceActive ? '-active' : ''}`}
              onClick={() => this.handleSourceSelection(sourceOptions.GRAPHITI)}
            >
                Graphiti DataSets
              </li>}
          {!isNewAsset && !isExternalSourceActive
            ? null
            : <li
              styleName={`list-item${isExternalSourceActive ? '-active' : ''}`}
              onClick={() => this.handleSourceSelection(sourceOptions.EXTERNAL)}
            >
                External Source
              </li>}
        </ul>
        {isExternalSourceActive
          ? <EditablePopUpComponent
            hasDefaultStyles={false}
            dataSource={dataSource}
            {...editablePopUpComponentProps}
          />
          : null}
      </div>
    );
  }
}

export default cssModules(PopUpComponent, styles);
