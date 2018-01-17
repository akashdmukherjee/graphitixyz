import React from 'react';
import PropTypes from 'prop-types';

const containerStyle = {
  width: '100%',
  position: 'relative',
};
const popUpComponentStyle = {
  position: 'absolute',
  width: '100%',
  transition: 'all 0.5s ease-in-out',
};

const propTypes = {
  label: PropTypes.string,
  triggerData: PropTypes.object,
  open: PropTypes.bool,
  onItemSelect: PropTypes.func,
  styles: PropTypes.shape({
    container: PropTypes.object,
    popUpComponent: PropTypes.object,
  }),
};

const defaultProps = {
  label: '',
  triggerData: {},
  open: false,
  styles: {
    container: {},
    popUpComponent: {},
  },
  onItemSelect: () => null,
};

const popUpHOC = (TriggerComponent, PopUpComponent) => {
  class WrappedComponent extends React.Component {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
      super(props);
      this.state = {
        open: props.open,
      };
    }

    componentDidMount() {
      window.addEventListener('click', this.handleDOMClick);
    }

    componentWillUnmount() {
      window.removeEventListener('click', this.handleDOMClick);
    }

    setRef = _ref => {
      this.wrappedComponent = _ref;
    };

    handleDOMClick = event => {
      const { target } = event;
      const { open } = this.state;
      if (
        this.wrappedComponent &&
        open &&
        target !== this.wrappedComponent &&
        !this.wrappedComponent.contains(target)
      ) {
        this.setState({ open: false });
      }
    };

    // these instance methods can be
    // accessed from outside the component using ref
    show = () => {
      this.setState({ open: true });
    };

    hide = () => {
      this.setState({ open: false });
    };

    toggle = () => {
      this.handleTriggerClick();
    };

    handleTriggerClick = () => {
      const open = !this.state.open;
      this.setState({ open });
    };

    handleItemSelect = data => {
      const { onItemSelect } = this.props;
      this.setState({ open: false });
      onItemSelect(data);
    };

    render() {
      const { open } = this.state;
      /*eslint-disable*/
      const { label, triggerData, onItemSelect, styles, ...restProps } = this.props;
      /*eslint-enable*/
      const display = open ? 'block' : 'none';
      const style = {
        display,
        opacity: open ? 1 : 0,
        ...popUpComponentStyle,
        ...styles.popUpComponent,
      };
      return (
        <div style={{ ...containerStyle, ...styles.container }} ref={this.setRef}>
          <TriggerComponent onClick={this.handleTriggerClick} label={label} data={triggerData} />
          <div style={style} className="PopUpComponent">
            <PopUpComponent onItemSelect={this.handleItemSelect} {...restProps} />
          </div>
        </div>
      );
    }
  }
  return WrappedComponent;
};

export default popUpHOC;
