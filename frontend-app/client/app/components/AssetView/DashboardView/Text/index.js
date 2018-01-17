import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import { Editor, createEditorState } from 'medium-draft';
import styles from './index.styl';
import 'medium-draft/lib/index.css';
import './rte.css';
import StyledItemWithContextMenu from '../StyledItemWithContextMenu';

const propTypes = {
  item: PropTypes.object.isRequired,
  onContextMenuItemClick: PropTypes.func.isRequired,
};

class Text extends Component {
  static propTypes = propTypes;
  constructor(props) {
    super(props);
    this.state = {
      editorState: createEditorState(),
    };
  }

  onChange = editorState => {
    this.setState({ editorState });
  };

  render() {
    const { editorState } = this.state;
    const { item, onContextMenuItemClick } = this.props;
    return (
      <StyledItemWithContextMenu item={item} onContextMenuItemClick={onContextMenuItemClick}>
        <Editor
          ref="editor"
          editorState={editorState}
          placeholder="Write here..."
          sideButtons={[]}
          onChange={this.onChange}
        />
      </StyledItemWithContextMenu>
    );
  }
}

export default cssModules(Text, styles);
