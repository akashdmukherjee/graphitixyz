import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const MAX_CHARACTER = 100;

const propTypes = {
  value: PropTypes.string,
  onValueChanged: PropTypes.func,
};

const defaultProps = {
  value: '',
  onValueChanged: () => null,
};

const inputname = 'description';

class DescriptionInput extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    const { value } = props;
    this.state = {
      characterCount: value.length,
      [inputname]: value,
    };
  }

  componentDidMount() {
    this.descriptionTextArea.focus();
  }

  handleOnChange = event => {
    const { name, value } = event.target;
    const characterCount = value.length;
    this.setState({
      [name]: value,
      characterCount,
    });
    this.props.onValueChanged({ value, characterCount });
  };

  render() {
    const { characterCount, description } = this.state;
    return (
      <div styleName="DescriptionInput">
        <textarea
          ref={_ref => {
            this.descriptionTextArea = _ref;
          }}
          name={inputname}
          value={description}
          placeholder="Add description"
          maxLength={MAX_CHARACTER}
          rows="3"
          onChange={this.handleOnChange}
        />
        <span>{characterCount}/{MAX_CHARACTER}</span>
      </div>
    );
  }
}

export default cssModules(DescriptionInput, styles);
