import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './popUp.styl';
import StyledPopUp from '../../../../common/StyledPopUp';
import ReactTooltip from 'react-tooltip';
import { TwitterPicker } from 'react-color';
import { colorCodes } from '../../colorCodes';

class PopUp extends Component {
  static propTypes = {
    assignedColorCodes: PropTypes.object.isRequired,
    onColorsApplied: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.assignedColors = this.getAssignedColors();

    this.state = {
      assignedColors: this.assignedColors,
      activeInput: null,
    };
    this.isDirty = false;
  }

  componentWillReceiveProps(nextProps) {
    const { assignedColorCodes } = nextProps;
    if (assignedColorCodes !== this.props.assignedColorCodes) {
      this.setState({ assignedColors: this.getAssignedColors(assignedColorCodes) });
    }
  }

  getAssignedColors(assignedColorCodesParam) {
    const assignedColorCodes = assignedColorCodesParam || this.props.assignedColorCodes;
    const assignedColors = {};
    if (!assignedColorCodes) return assignedColors;
    assignedColorCodes.forEach(assignedColorCode => {
      assignedColors[assignedColorCode.value] = assignedColorCode.color;
    });
    return assignedColors;
  }

  handleChangeComplete = (color, name) => {
    const assignedColors = { ...this.state.assignedColors };
    assignedColors[name] = color;
    this.setState({ assignedColors, activeInput: null });
    this.isDirty = true;
    this.handleApplyClick(assignedColors);
  };

  handleInputFocus = ({ target }) => {
    const { name } = target;
    this.setState({ activeInput: name });
  };

  handleInputBlur = () => {
    this.setState({ activeInput: null });
  };

  handleApplyClick = assignedColors => {
    if (this.isDirty) {
      this.props.onColorsApplied(assignedColors);
    }
    this.isDirty = false;
  };

  renderRow(assignedColorValue, assignedColor) {
    const sanitizedValue = assignedColorValue.replace(/\$\$\$\$/gi, ', ');
    const { activeInput } = this.state;
    return (
      <div styleName="row">
        <input
          styleName="color-preview"
          style={{
            backgroundColor: assignedColor,
            color: window.getFontColor_forBackgroundRgb(window.hexToRGB(assignedColor)),
          }}
          value={sanitizedValue}
          name={assignedColorValue}
          onClick={this.handleInputFocus}
        />
        <div
          style={{
            display: activeInput === assignedColorValue ? 'block' : 'none',
            position: 'absolute',
            zIndex: 999,
            top: 35,
          }}
        >
          <TwitterPicker
            colors={colorCodes}
            onChange={color => this.handleChangeComplete(color.hex, assignedColorValue)}
          />
        </div>
      </div>
    );
  }

  render() {
    const { assignedColors } = this.state;
    if (!assignedColors) return null;
    return (
      <StyledPopUp
        caretPosition="right"
        style={{
          padding: 10,
        }}
      >
        <div>
          {Object.keys(assignedColors).map(key => this.renderRow(key, assignedColors[key]))}
        </div>
      </StyledPopUp>
    );
  }
}

export default cssModules(PopUp, styles);
