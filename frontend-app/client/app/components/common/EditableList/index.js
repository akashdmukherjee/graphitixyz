import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const generateRandomId = () => Math.random().toString().slice(3, 10);

const caretPositions = {
  left: 'left',
  right: 'right',
  middle: 'middle',
};

class EditableList extends Component {
  static propTypes = {
    dataSource: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        selected: PropTypes.bool,
      })
    ),
    open: PropTypes.bool,
    caretPosition: PropTypes.oneOf([
      caretPositions.left,
      caretPositions.right,
      caretPositions.middle,
    ]),
    hasHeaderInputRow: PropTypes.bool,
    headerName: PropTypes.string.isRequired,
    showListIcon: PropTypes.bool,
    buttonText: PropTypes.string,
    style: PropTypes.object,
    hasFixedList: PropTypes.bool,
    fixedListDataSource: PropTypes.arrayOf(PropTypes.string),
    transformIconName: PropTypes.func,
    transformDynamicListItemLabel: PropTypes.func,
    onVisibilityChanged: PropTypes.func,
    onListUpdated: PropTypes.func,
    onEditItemClick: PropTypes.func,
    onHeaderButtonClick: PropTypes.func,
    onSwitchClick: PropTypes.func,
    onFixedListItemClick: PropTypes.func,
    transformFixedListIconName: PropTypes.func,
    transformFixedListItemLabel: PropTypes.func,
    injectFixedListItemChildren: PropTypes.func,
  };

  static defaultProps = {
    style: {},
    open: false,
    caretPosition: 'right',
    showListIcon: false,
    hasHeaderInputRow: true,
    buttonText: null,
    transformIconName: () => 'fa fa-code',
    dataSource: [],
    fixedListDataSource: [],
    hasFixedList: false,
    onListUpdated: () => null,
    onEditItemClick: null,
    onSwitchClick: () => null,
    onVisibilityChanged: () => null,
    onFixedListItemClick: () => null,
    transformFixedListIconName: () => 'fa fa-user',
    transformFixedListItemLabel: () => '',
    onHeaderButtonClick: () => null,
    injectFixedListItemChildren: () => null,
    transformDynamicListItemLabel: itemData => itemData.name,
  };

  constructor(props) {
    super(props);
    const dataListWithIds = this.constructListData(props.dataSource);
    this.state = {
      dataList: dataListWithIds,
      currentEditItemId: null,
      values: this.constructInputValues(dataListWithIds),
      inputValueChanged: {},
      hover: this.constructHoverData(dataListWithIds),
      hoverDisabled: false,
      open: props.open,
      headerInputHasValue: false,
    };
  }

  componentDidMount() {
    window.addEventListener('click', this.onDOMClick);
  }

  componentWillReceiveProps(nextProps) {
    const { dataSource } = nextProps;
    const object = {};
    if (dataSource !== this.props.dataSource) {
      const dataListWithIds = this.constructListData(dataSource);
      object.dataList = dataListWithIds;
      object.values = this.constructInputValues(dataListWithIds);
      object.hover = this.constructHoverData(dataListWithIds);
    }
    this.setState(object);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onDOMClick);
  }

  constructListData(dataSource) {
    if (dataSource.length && dataSource[0].id) return dataSource;
    const dataListCopy = [...dataSource];
    return dataListCopy.map(data => ({
      ...data,
      id: generateRandomId(),
      selected: data.selected !== undefined ? data.selected : false,
    }));
  }

  constructHoverData(dataListWithIds) {
    const hover = {};
    dataListWithIds.forEach(data => {
      hover[data.id] = false;
    });
    return hover;
  }

  constructInputValues = dataListWithIds => {
    const { transformDynamicListItemLabel } = this.props;
    const inputValues = {};
    dataListWithIds.forEach(data => {
      inputValues[data.id] = transformDynamicListItemLabel(data);
    });
    return inputValues;
  };

  onDOMClick = event => {
    const { target } = event;
    if (
      this.editableList &&
      this.editableList !== target &&
      !this.editableList.contains(target)
    ) {
      // on clicked away
      this.setState({ open: false }, () => {
        // tell the parent that visibility has changed
        this.props.onVisibilityChanged({ open: false });
      });
    }
  };

  onEditItemClick = itemData => {
    const { onEditItemClick } = this.props;
    if (onEditItemClick) {
      onEditItemClick(itemData);
      return;
    }
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
    const hoverCopy = { ...hover };
    Object.keys(hoverCopy).forEach(hoverId => {
      hoverCopy[hoverId] = false;
    });
    this.setState({ hover: hoverCopy });
  };

  onInputChange = event => {
    const { name, value } = event.target;
    const { values, inputValueChanged } = this.state;
    const object = {};
    if (values[name] !== value) {
      inputValueChanged[name] = true;
      object.inputValueChanged = inputValueChanged;
    }
    if (name === 'headerInput') {
      object.headerInputHasValue = value.length > 0;
    }
    this.setState({ values: { ...values, [name]: value }, ...object });
  };

  handleInputKeyPress = event => {
    if (event.keyCode === 13) {
      this.onDone(event.target.name);
    }
  };

  onDone = id => {
    this.refs[id].blur();
    this.setState(
      {
        inputValueChanged: {},
        hoverDisabled: false,
        currentEditItemId: null,
      },
      () => {
        this.props.onListUpdated(this.state.dataList);
      }
    );
  };

  onIconClick = data => {
    const { inputValueChanged } = this.state;
    if (inputValueChanged[data.id]) {
      this.onDone(data.id);
    } else {
      this.onEditItemClick(data);
    }
  };

  onFixedListItemClick = itemData => {
    const { onFixedListItemClick } = this.props;
    onFixedListItemClick(itemData);
  };

  handleHeaderButtonClick = () => {
    const { headerInputHasValue, values } = this.state;
    const { onHeaderButtonClick } = this.props;
    if (!headerInputHasValue) return;
    onHeaderButtonClick({ name: values.headerInput });
  };

  show = () => {
    this.setState({ open: false });
  };

  hide = () => {
    this.setState({ open: false });
  };

  toggle = () => {
    this.setState({ open: !this.state.open });
  };

  handleSwitchClick = itemData => {
    const { onSwitchClick } = this.props;
    onSwitchClick(itemData);
    const { dataList } = this.state;
    const dataListCopy = [...dataList];
    const newDataList = dataListCopy.map(data => {
      if (data.id === itemData.id) {
        return { ...data, selected: true };
      }
      return { ...data, selected: false };
    });
    this.setState({ dataList: newDataList, open: false });
  };

  render() {
    const { style, caretPosition, headerName, hasFixedList } = this.props;
    const { open } = this.state;
    return (
      <div
        styleName={`EditableList caret-${caretPosition}`}
        style={{ ...style, display: open ? 'block' : 'none' }}
        ref={_ref => {
          this.editableList = _ref;
        }}
      >
        <div styleName="header">
          <h5>{headerName}</h5>
        </div>
        <ul styleName="dynamic-list" onMouseLeave={this.onMouseLeave}>
          {this.renderHeaderInputRow()}
          {this.renderDynamicList()}
        </ul>
        {hasFixedList
          ? <ul styleName="fixed-list">
              {this.renderFixedList()}
            </ul>
          : false}

      </div>
    );
  }

  renderHeaderInputRow() {
    const { headerName, buttonText, hasHeaderInputRow } = this.props;
    const { headerInputHasValue, values } = this.state;
    if (!hasHeaderInputRow) return null;
    let btnText = buttonText;
    if (!btnText) {
      btnText = `New ${headerName}`;
    }
    return (
      <li>
        <input
          type="text"
          name="headerInput"
          placeholder={`New ${headerName} Name`}
          value={values.headerInput}
          onChange={this.onInputChange}
        />
        <button
          styleName={`btn-red${headerInputHasValue ? '' : '-disabled'}`}
          onClick={this.handleHeaderButtonClick}
        >
          {btnText}
        </button>
      </li>
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
      <span
        styleName={styleName}
        onClick={e => {
          e.nativeEvent.stopImmediatePropagation();
          this.onIconClick(data);
        }}
      >
        {inputValueChanged[data.id]
          ? <i className="icon-check" />
          : <i className="icon-pencil" />}
      </span>
    );
  }

  renderListIcon(data) {
    const { showListIcon, transformIconName } = this.props;
    if (showListIcon) {
      return (
        <div styleName="list-icon">
          <i className={transformIconName(data)} />
        </div>
      );
    }
    return null;
  }

  renderDynamicList = () => {
    const { dataList } = this.state;
    return dataList.map(data => {
      return (
        <li key={data.id} onMouseEnter={() => this.onHover(data.id)}>
          <div>
            {this.renderListIcon(data)}
            {this.renderEditableItem(data)}
            {this.renderEditIcon(data)}
          </div>
          <button
            styleName={data.selected ? 'btn-selected' : 'button'}
            onClick={() => {
              this.handleSwitchClick(data);
            }}
          >
            {data.selected ? 'Selected' : 'Switch'}
          </button>
        </li>
      );
    });
  };

  renderFixedList() {
    const {
      fixedListDataSource,
      transformFixedListIconName,
      transformFixedListItemLabel,
      injectFixedListItemChildren,
    } = this.props;
    return fixedListDataSource.map(data => {
      const onFixedListItemClick = this.onFixedListItemClick(data);
      return (
        <li
          key={data.name || data.text || data.label}
          onClick={onFixedListItemClick}
        >
          <i className={transformFixedListIconName(data)} />
          <div styleName="item-text">
            {data.name ||
              data.text ||
              data.label ||
              transformFixedListItemLabel(data)}
          </div>
          {injectFixedListItemChildren(data)}
        </li>
      );
    });
  }
}

export default cssModules(EditableList, styles, { allowMultiple: true });
