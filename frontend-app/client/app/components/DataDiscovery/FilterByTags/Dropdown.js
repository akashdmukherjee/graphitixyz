import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './dropdown.styl';
import Tag from '../../common/Tag';

const tagStyle = {
  tagWrapper: { margin: 5 },
};

const propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
};
const defaultProps = {};

class Dropdown extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    this.state = {
      activeTags: [],
      tags: props.tags,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { tags } = nextProps;
    if (tags !== this.props.tags) {
      this.setState({ tags });
    }
  }

  handleTagClick = (e, label) => {
    const activeTags = this.state.activeTags.slice(0);
    const activeTagIndex = activeTags.indexOf(label);
    if (activeTagIndex === -1) {
      activeTags.push(label);
    } else {
      activeTags.splice(activeTagIndex, 1);
    }
    this.props.setActiveTags(activeTags);
    this.setState({ activeTags });
  };

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.tags !== nextState.tags) {
      return true;
    }
    if (this.state.activeTags === nextState.activeTags) {
      return false;
    }
    return true;
  }

  render() {
    const { tags, activeTags } = this.state;
    if (!tags) return null;
    let Tags = null;
    if (typeof tags === 'string') {
      Tags = (
        <Tag
          key={tags}
          label={tags}
          style={tagStyle}
          interactive={false}
          active={activeTags.indexOf(tags) !== -1}
          onTagClick={this.handleTagClick}
        />
      );
    } else {
      Tags = tags.map(tag => (
        <Tag
          key={tag}
          label={tag}
          style={tagStyle}
          interactive={false}
          active={activeTags.indexOf(tag) !== -1}
          onTagClick={this.handleTagClick}
        />
      ));
    }
    return (
      <div styleName="Tags-wrapper">
        {Tags}
      </div>
    );
  }
}

export default cssModules(Dropdown, styles);
