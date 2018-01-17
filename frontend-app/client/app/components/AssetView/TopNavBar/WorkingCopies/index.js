import React, { Component, PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import Button from '../../Button';

const generateRandomId = () => Math.random().toString().slice(3, 10);

class WorkingCopies extends Component {
  static propTypes = {
    workingCopies: PropTypes.arrayOf(PropTypes.object),
  };

  static defaultProps = {
    workingCopies: [
      {
        name: 'Production',
        selected: true,
      },
      {
        name: 'Development',
        selected: false,
      },
      {
        name: 'Akash Working Copy',
        selected: false,
      },
      {
        name: 'Adding More filters WIP',
        selected: false,
      },
    ],
  };
  constructor(props) {
    super(props);
    const dataListWithIds = this.constructListData();
    this.state = {
      workingCopies: dataListWithIds,
      currentEditItemId: null,
      values: this.constructInputValues(dataListWithIds),
      inputValueChanged: {},
      hover: this.constructHoverData(dataListWithIds),
      hoverDisabled: false,
    };
  }

  constructListData() {
    const { workingCopies } = this.props;
    const dataListCopy = [...workingCopies];
    return dataListCopy.map(data => ({ ...data, id: generateRandomId() }));
  }

  constructHoverData(dataListWithIds) {
    const hover = {};
    dataListWithIds.forEach(data => {
      hover[data.id] = false;
    });
    return hover;
  }

  constructInputValues = dataListWithIds => {
    const inputValues = {};
    dataListWithIds.forEach(data => {
      inputValues[data.id] = data.name;
    });
    return inputValues;
  };

  onEditItemClick = itemData => {
    const editInput = this.refs[itemData.id];
    this.setState(
      { currentEditItemId: itemData.id, hoverDisabled: true },
      () => {
        editInput.focus();
        editInput.select();
      }
    );
  };

  onHover = id => {
    const { hover, hoverDisabled } = this.state;
    if (hoverDisabled) return;
    const hoverCopy = { ...hover };
    Object.keys(hoverCopy).forEach(hoverId => {
      hoverCopy[hoverId] = false;
      if (hoverId === id) {
        hoverCopy[hoverId] = true;
      }
    });
    this.setState({ hover: hoverCopy });
  };

  onMouseLeave = () => {
    const { hover } = this.state;
    console.info('onMouseLeave');
    const hoverCopy = { ...hover };
    Object.keys(hoverCopy).forEach(hoverId => {
      hoverCopy[hoverId] = false;
    });
    this.setState({ hover: hoverCopy });
  };

  onInputChange = event => {
    const { name, value } = event.target;
    const { values, inputValueChanged } = this.state;
    if (values[name] !== value) {
      inputValueChanged[name] = true;
    }
    this.setState({ values: { [name]: value }, inputValueChanged });
  };

  handleInputKeyPress = event => {
    if (event.keyCode === 13) {
      this.onDone(event.target.name);
    }
  };

  onDone = id => {
    this.refs[id].blur();
    this.setState({
      inputValueChanged: {},
      hoverDisabled: false,
      currentEditItemId: null,
    });
  };

  onIconClick = data => {
    const { inputValueChanged } = this.state;
    if (inputValueChanged[data.id]) {
      this.onDone(data.id);
    } else {
      this.onEditItemClick(data);
    }
  };

  render() {
    return (
      <div styleName="working-copies">
        <div styleName="header">
          <h5>Versions</h5>
        </div>
        <ul onMouseLeave={this.onMouseLeave}>
          <li>
            <input
              type="text"
              name="workingCopyName"
              placeholder="New Version Name"
            />
            <button styleName="btn-red">New Version</button>
          </li>
          {this.renderWorkingCopies()}
        </ul>
      </div>
    );
  }

  renderEditableItem(itemData) {
    const { currentEditItemId, values } = this.state;
    return (
      <input
        ref={itemData.id}
        styleName="edit-input"
        type="text"
        name={itemData.id}
        value={values[itemData.id]}
        disabled={!(currentEditItemId === itemData.id)}
        onChange={this.onInputChange}
        onKeyDown={this.handleInputKeyPress}
      />
    );
  }

  renderEditIcon(data) {
    const {
      inputValueChanged,
      hover,
      hoverDisabled,
      currentEditItemId,
    } = this.state;
    let styleName = '';
    if (hoverDisabled && currentEditItemId === data.id) {
      styleName = `hovered${inputValueChanged[data.id] ? '-checked' : ''}`;
    } else if (hover[data.id]) {
      styleName = 'hovered';
    }
    return (
      <span styleName={styleName} onClick={() => this.onIconClick(data)}>
        {inputValueChanged[data.id]
          ? <i className="icon-check" />
          : <i className="icon-pencil" />}
      </span>
    );
  }

  renderWorkingCopies = () => {
    const { workingCopies } = this.state;
    return workingCopies.map(workingCopy => (
      <li
        key={workingCopy.id}
        onMouseEnter={() => this.onHover(workingCopy.id)}
      >
        <div>
          {this.renderEditableItem(workingCopy)}
          {this.renderEditIcon(workingCopy)}
        </div>
        <button styleName={workingCopy.selected ? 'btn-selected' : 'button'}>
          {workingCopy.selected ? 'Selected' : 'Switch'}
        </button>
      </li>
    ));
  };
}

export default cssModules(WorkingCopies, styles);
