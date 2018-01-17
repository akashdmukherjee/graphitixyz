import React, { PropTypes } from 'react';
import Collapse from 'react-collapse';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const anchorIconPositions = {
  left: 'left',
  right: 'right',
};

class Collapsible extends React.Component {
  static propTypes() {
    return {
      children: React.PropTypes.any,
      iconName: React.PropTypes.string,
      triggerText: React.PropTypes.string,
      style: PropTypes.shape({
        trigger: PropTypes.object,
      }),
      isOpen: React.PropTypes.bool,
      anchorIconPosition: PropTypes.string,
      onClick: React.PropTypes.func,
      renderRightIcon: React.PropTypes.func,
    };
  }

  static defaultProps = {
    isOpen: false,
    style: {
      trigger: {
        backgroundColor: '#f7f8fa',
      },
    },
    anchorIconPosition: anchorIconPositions.right,
    iconName: false,
    renderRightIcon: () => null,
  };

  constructor(props) {
    super(props);
    const { isOpen } = props;
    this.state = {
      isOpen,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { isOpen } = nextProps;
    if (isOpen !== this.props.isOpen) {
      this.setState({ isOpen });
    }
  }

  onCollapsibleClick = () => {
    const { onClick, triggerText } = this.props;
    const isOpen = !this.state.isOpen;
    this.setState({ isOpen });

    if (onClick) {
      onClick({ text: triggerText, isOpen });
    }
  };

  render() {
    const {
      children,
      style,
      triggerText,
      iconName,
      anchorIconPosition,
      renderRightIcon,
    } = this.props;
    const { isOpen } = this.state;
    const collapseStyle = {
      backgroundColor: '#fff',
    };
    const triggerBgColor = style.trigger.backgroundColor;
    return (
      <div styleName="collapsible-wrapper">
        <div
          onClick={this.onCollapsibleClick}
          styleName="trigger-wrapper"
          style={{
            backgroundColor: isOpen ? 'rgba(58,56,52,.08)' : triggerBgColor,
            justifyContent: anchorIconPositions.left === anchorIconPosition
              ? 'flex-start'
              : 'space-between',
          }}
        >
          {iconName
            ? <i
              styleName="left-icon"
              className={`fa fa-${iconName}`}
              style={isOpen ? { color: '#444444' } : null}
            />
            : null}
          {anchorIconPositions.left === anchorIconPosition
            ? <i
              className={`fa fa-angle-${isOpen ? 'down' : 'right'}`}
              style={{
                marginRight: 10,
              }}
            />
            : null}
          <h5 style={isOpen ? { color: '#444444' } : null}>{triggerText}</h5>
          {anchorIconPositions.right === anchorIconPosition
            ? <i
              className={`fa fa-angle-${isOpen ? 'down' : 'up'}`}
              style={isOpen ? { color: '#444444' } : null}
            />
            : null}
          {renderRightIcon ? renderRightIcon(triggerText) : null}
        </div>
        <Collapse
          isOpened={isOpen}
          style={collapseStyle}
          springConfig={{ stiffness: 150, damping: 21 }}
        >
          {children}
        </Collapse>
      </div>
    );
  }
}

export default cssModules(Collapsible, styles);
