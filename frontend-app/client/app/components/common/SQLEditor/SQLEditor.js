import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import MonacoEditor from 'react-monaco-editor';
import ThemeRules, { ThemeName } from './ThemeRules';
import registerCompletionItemProvider from './registerCompletionItemProvider';
import styles from './sqlEditor.styl';
import './sqlEditor.css';

let alreadyRendered = false;

class SQLEditor extends React.Component {
  static propTypes = {
    wrapperStyle: PropTypes.object,
    apiData: PropTypes.object.isRequired,
    selectedConnection: PropTypes.object.isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    value: PropTypes.string,
    onChange: PropTypes.func,
    onMount: PropTypes.func,
  };

  static defaultProps = {
    wrapperStyle: {
      width: '100%',
    },
    value: '',
    width: '100%',
    height: '100%',
    onMount: () => null,
    onChange: () => null,
  };

  constructor(props) {
    super(props);
    const { width, height } = props;
    this.state = {
      width,
      height,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { width, height } = nextProps;
    const stateUpdateObject = {};
    if (width !== this.props.width) {
      stateUpdateObject.width = width;
    }
    if (height !== this.props.height) {
      stateUpdateObject.height = height;
    }
    this.setState(stateUpdateObject);
  }

  editorWillMount(monaco) {
    monaco.editor.defineTheme(ThemeName, ThemeRules);
    window.postMessage({ type: 'NEW_RENDER', data: window.location.pathname }, '*');
  }

  editorDidMount = (editor, monaco) => {
    // this is needed because of force re-rendering
    // using key
    if (!alreadyRendered) {
      registerCompletionItemProvider(editor, monaco, this.props.apiData);
      alreadyRendered = true;
      this.props.onMount();
    }
    editor.focus();
  };

  render() {
    const { wrapperStyle, value, onChange } = this.props;
    const { width, height } = this.state;
    const requireConfig = {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.1/require.min.js',
      paths: {
        vs: 'http://localhost:3000/vs',
      },
    };
    return (
      <div styleName="sql-editor" style={wrapperStyle}>
        <MonacoEditor
          width={width}
          height={height - 5}
          language="sql"
          value={value}
          options={{
            theme: ThemeName,
            fontSize: 14,
            contextmenu: false,
          }}
          onChange={onChange}
          editorDidMount={this.editorDidMount}
          editorWillMount={this.editorWillMount}
          requireConfig={requireConfig}
        />
      </div>
    );
  }
}

export default cssModules(SQLEditor, styles);
