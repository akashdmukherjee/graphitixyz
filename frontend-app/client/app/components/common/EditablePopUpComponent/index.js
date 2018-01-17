/**
 * This is a PopUpComponent
 * which must be used with popUpHOC
 */
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

class EditablePopUpComponent extends Component {
  static propTypes = {
    dataSource: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        selected: PropTypes.bool,
      })
    ),
    caretPosition: PropTypes.oneOf([
      caretPositions.left,
      caretPositions.right,
      caretPositions.middle,
    ]),
    hasDefaultStyles: PropTypes.bool,
    hasHeaderInputRow: PropTypes.bool,
    headerName: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    headerButtonStyle: PropTypes.object,
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
    onItemInputChange: PropTypes.func,
    onItemInputBlur: PropTypes.func,
    onItemInputDone: PropTypes.func,
    onHeaderButtonClick: PropTypes.func,
    onSwitchClick: PropTypes.func,
    onFixedListItemClick: PropTypes.func,
    transformFixedListIconName: PropTypes.func,
    transformFixedListItemLabel: PropTypes.func,
    injectFixedListItemChildren: PropTypes.func,
    onHeaderInputBlur: PropTypes.func,
  };

  static defaultProps = {
    style: {},
    headerButtonStyle: {},
    placeholder: null,
    caretPosition: 'right',
    showListIcon: false,
    hasHeaderInputRow: true,
    buttonText: null,
    transformIconName: () => 'fa fa-code',
    dataSource: [],
    fixedListDataSource: [],
    hasFixedList: false,
    hasDefaultStyles: true,
    onListUpdated: () => null,
    onSwitchClick: () => null,
    onVisibilityChanged: () => null,
    onFixedListItemClick: () => null,
    transformFixedListIconName: () => 'fa fa-user',
    transformFixedListItemLabel: () => '',
    onHeaderButtonClick: () => null,
    injectFixedListItemChildren: () => null,
    onHeaderInputBlur: () => null,
    onItemInputChange: () => null,
    onItemInputBlur: () => null,
    onItemInputDone: () => null,
    onEditItemClick: () => null,
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
      headerInputHasValue: false,
    };
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

  constructListData(dataSource) {
    if (!dataSource.length) return [];
    const dataListCopy = [...dataSource];
    return dataListCopy.map(data => ({
      ...data,
      id: data.id || generateRandomId(),
      selected: data.selected !== undefined ? data.selected : false,
      editable: data.editable !== undefined ? data.editable : true,
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
    const inputValues = {
      headerInput: '',
    };
    dataListWithIds.forEach(data => {
      inputValues[data.id] = transformDynamicListItemLabel(data);
    });
    return inputValues;
  };

  onEditItemClick = itemData => {
    const { onEditItemClick } = this.props;
    onEditItemClick(itemData);
    const editInput = this.refs[itemData.id];
    this.setState({ currentEditItemId: itemData.id, hoverDisabled: true }, () => {
      editInput.focus();
      editInput.select();
    });
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
    const { onItemInputChange } = this.props;
    const object = {};
    if (values[name] !== value) {
      inputValueChanged[name] = true;
      object.inputValueChanged = inputValueChanged;
    }
    if (name === 'headerInput') {
      object.headerInputHasValue = value.length > 0;
    }
    onItemInputChange(value);
    this.setState({ values: { ...values, [name]: value }, ...object });
  };

  handleInputKeyPress = event => {
    const { name, value } = event.target;
    const { onHeaderInputBlur, onItemInputDone } = this.props;
    if (event.keyCode === 13 || event.charCode === 13) {
      if (name === 'headerInput') {
        const values = { ...this.state.values };
        onHeaderInputBlur(value);
        values[name] = '';
        this.setState({ values });
      } else {
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
        onItemInputDone(value);
      }
      this.refs[name].blur();
    }
  };

  handleItemInputBlur = event => {
    const { onItemInputBlur } = this.props;
    const { value } = event.target;
    onItemInputBlur(value);
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
    this.setState({ dataList: newDataList });
  };

  render() {
    const { style, caretPosition, headerName, hasFixedList, hasDefaultStyles } = this.props;
    const wrapperStyleName = hasDefaultStyles
      ? `EditablePopUpComponent-style caret-${caretPosition}`
      : 'EditablePopUpComponent-no-style';

    return (
      <div
        styleName={wrapperStyleName}
        style={style}
        ref={_ref => {
          this.editableList = _ref;
        }}
      >
        <div styleName="header">
          <h5>
            {headerName}
          </h5>
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
    const {
      headerName,
      buttonText,
      hasHeaderInputRow,
      headerButtonStyle,
      placeholder,
    } = this.props;
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
          ref="headerInput"
          placeholder={`${placeholder || headerName}`}
          value={values.headerInput}
          onChange={this.onInputChange}
          onKeyPress={this.handleInputKeyPress}
        />
        <button
          style={headerButtonStyle}
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
        onBlur={this.handleItemInputBlur}
      />
    );
  }

  renderEditIcon(data) {
    if (!data.editable) return null;
    const { inputValueChanged, hover, hoverDisabled, currentEditItemId } = this.state;
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
        {inputValueChanged[data.id] ? <i className="icon-check" /> : <i className="icon-pencil" />}
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
        <li key={data.name || data.text || data.label} onClick={onFixedListItemClick}>
          <i className={transformFixedListIconName(data)} />
          <div styleName="item-text">
            {data.name || data.text || data.label || transformFixedListItemLabel(data)}
          </div>
          {injectFixedListItemChildren(data)}
        </li>
      );
    });
  }
}

export default cssModules(EditablePopUpComponent, styles, {
  allowMultiple: true,
});
