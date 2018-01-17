import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import ListWrapper from '../../../common/ListWrapper';

const inputname = 'tag';
const dataSource = [
  'Tech',
  'Report',
  'Users',
  'Monthly',
  'Technology',
  'Reporting',
  'User Data',
  'Sales',
  'Marketing',
  'Reporting',
  'Marketer',
  'SQL',
  'Asset',
  'DataSet',
];

const propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onTagSelect: PropTypes.func,
};

const defaultProps = {
  onTagSelect: () => null,
};

class TagsInput extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    this.state = {
      [inputname]: '',
      open: false,
      tags: props.tags,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { tags } = nextProps;
    if (tags !== this.props.tags) {
      this.setState({ tags });
    }
  }

  handleInputChange = event => {
    const { name, value } = event.target;
    this.setState({ [name]: value, open: value.length > 0 });
  };

  handleTagSelect = tag => {
    this.setState({
      [inputname]: '',
      open: false,
    });
    this.props.onTagSelect(tag);
  };

  render() {
    const { tag } = this.state;
    return (
      <div styleName="TagsInput">
        <input
          value={tag}
          name={inputname}
          placeholder="Add a tag..."
          onChange={this.handleInputChange}
        />
        {this.renderFilteredList()}
      </div>
    );
  }

  renderFilteredList() {
    const { tag, open, tags } = this.state;
    if (tag.length) {
      let newTag = false;
      let filteredList = tags.filter(text =>
        text.match(new RegExp(`^${tag}`, 'i'))
      );
      if (
        filteredList.find(
          filteredData => filteredData.toLowerCase() === tag.toLowerCase()
        ) === undefined
      ) {
        filteredList = [...filteredList, tag];
        newTag = true;
      }
      const filteredListLength = filteredList.length;
      return (
        <ListWrapper
          open={open}
          caretPosition="left"
          style={{
            left: 0,
            width: 150,
          }}
        >
          <ul styleName="tags">
            {filteredList.map((text, index) => (
              <li
                key={text}
                styleName="tag"
                onClick={() => this.handleTagSelect(text)}
              >
                {filteredListLength - 1 === index && newTag
                  ? <small styleName="newTag">New Tag</small>
                  : null}
                {text}
              </li>
            ))}
          </ul>
        </ListWrapper>
      );
    }
    return null;
  }
}

export default cssModules(TagsInput, styles);
