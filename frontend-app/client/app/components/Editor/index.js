import React, { Component } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/display/autorefresh';
import 'codemirror/theme/neo.css';
import './codemirror.custom.css';

class Editor extends Component {
  static propTypes= {
    onChange: React.PropTypes.func,
    onFocusChange: React.PropTypes.func,
    options: React.PropTypes.object,
    style: React.PropTypes.object,
    path: React.PropTypes.string,
    defaultValue: React.PropTypes.string,
    value: React.PropTypes.string,
    className: React.PropTypes.any,
    codeMirrorInstance: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.state = {
      isFocused: false,
    };
  }


  componentDidMount() {
    const textareaNode = this.refs.textarea;
    const codeMirrorInstance = this.getCodeMirrorInstance();
    this.codeMirror = codeMirrorInstance.fromTextArea(textareaNode, this.props.options);
    this.codeMirror.on('change', this.codemirrorValueChanged.bind(this));
    this.codeMirror.on('change', this.codemirrorValueChanged.bind(this));
    this.codeMirror.on('focus', this.focusChanged.bind(this, true));
    this.codeMirror.on('blur', this.focusChanged.bind(this, false));
    this.codeMirror.setValue(this.props.defaultValue || this.props.value || '');
  }

  componentWillReceiveProps(nextProps) {
    if (this.codeMirror && nextProps.value !== undefined && this.codeMirror.getValue() != nextProps.value) {
      this.codeMirror.setValue(nextProps.value);
    }
    if (typeof nextProps.options === 'object') {
      for(let optionName in nextProps.options) {
        if (nextProps.options.hasOwnProperty(optionName)) {
          this.codeMirror.setOption(optionName, nextProps.options[optionName]);
        }
      }
    }
  }

  componentWillUnmount() {
    // is there a lighter-weight way to remove the cm instance?
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
    }
  }

  getCodeMirrorInstance() {
    return this.props.codeMirrorInstance || CodeMirror;
  }

  getCodeMirror() {
    return this.codeMirror;
  }

  focus() {
    if (this.codeMirror) {
      this.codeMirror.focus();
    }
  }

  focusChanged(focused) {
    this.setState({
      isFocused: focused,
    });
    this.props.onFocusChange && this.props.onFocusChange(focused);
  }

  codemirrorValueChanged(doc, change) {
    if (this.props.onChange && change.origin !== 'setValue') {
      this.props.onChange(doc.getValue());
    }
  }

  render() {
    const { style } = this.props;
    return (
      <div className={"Editor"} style={style}>
        <textarea
          ref="textarea"
          name={this.props.path}
          defaultValue={this.props.value}
          autoComplete="off"
        />
      </div>
    );
  }
}

export default Editor;
