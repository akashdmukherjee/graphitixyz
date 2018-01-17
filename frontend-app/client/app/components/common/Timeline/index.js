import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const propTypes = {
  checkPoints: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string,
      distance: PropTypes.string, // distance from starting point: optional
    })
  ),
  width: PropTypes.number,
  activeCheckPointIndex: PropTypes.number, // index in the checkPoints array
  showText: PropTypes.bool,
};

const defaultProps = {
  checkPoints: [],
  width: 400,
  activeCheckPointIndex: 0,
  showText: false,
};

class Timeline extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    const { activeCheckPointIndex } = props;
    this.state = {
      activeCheckPointIndex,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { activeCheckPointIndex } = nextProps;
    if (activeCheckPointIndex !== this.props.activeCheckPointIndex) {
      this.setState({ activeCheckPointIndex });
    }
  }

  render() {
    const { checkPoints, width, showText } = this.props;
    const { activeCheckPointIndex } = this.state;
    const numberOfCheckPoints = checkPoints.length;
    const checkPointGap = width / numberOfCheckPoints;
    return (
      <div styleName="Timeline" style={{ width: width - checkPointGap }}>
        <div
          styleName="Timeline-bg"
          style={{ width: checkPointGap * activeCheckPointIndex }}
        />
        {checkPoints.map((checkPoint, index) => (
          <div
            styleName={`checkPoint ${index <= activeCheckPointIndex ? 'active' : ''}`}
            style={{ left: checkPointGap * index - 5 }}
          >
            {showText
              ? <div styleName="content">
                  <div styleName="text">{checkPoint.text}</div>
                </div>
              : null}
            {index + 1}
          </div>
        ))}
      </div>
    );
  }
}

export default cssModules(Timeline, styles, { allowMultiple: true });
