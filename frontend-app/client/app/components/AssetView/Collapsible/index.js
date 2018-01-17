import React from 'react';
import Collapse from 'react-collapse';
import cssModules from 'react-css-modules';
import styles from './index.styl';

class Collapsible extends React.Component {
  static propTypes() {
    return {
      children: React.PropTypes.any,
      iconName: React.PropTypes.string,
      triggerText: React.PropTypes.string,
      isOpen: React.PropTypes.bool,
      onClick: React.PropTypes.func,
    };
  }

  static defaultProps = {
    isOpen: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { isOpen } = nextProps;
    if (isOpen || isOpen === false) {
      this.setState({ isOpen });
    }
  }

  onCollapsibleClick = () => {
    const { onClick, triggerText } = this.props;
    this.setState({ isOpen: !this.state.isOpen });

    if (onClick) {
      onClick(triggerText);
    }
  };

  render() {
    const { children, triggerText, iconName } = this.props;
    const { isOpen } = this.state;
    const collapseStyle = {
      backgroundColor: '#fff',
    };
    return (
      <div styleName="collapsible-wrapper">
        <div
          onClick={this.onCollapsibleClick}
          styleName="trigger-wrapper"
          style={{ backgroundColor: isOpen ? '#eeeff2' : '#f7f8fa' }}
        >
          {iconName
            ? <i
              styleName="left-icon"
              className={`fa fa-${iconName}`}
              style={isOpen ? { color: '#444444' } : null}
            />
            : null}
          <h5 style={isOpen ? { color: '#444444' } : null}>{triggerText}</h5>
          <i
            className={`fa fa-angle-${isOpen ? 'down' : 'up'}`}
            style={isOpen ? { color: '#444444' } : null}
          />
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
