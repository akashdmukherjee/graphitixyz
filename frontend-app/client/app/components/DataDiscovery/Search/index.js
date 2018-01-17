import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styles from './index.styl';
import DropdownMenu from '../DropdownMenu';
import FilterByTags from '../FilterByTags';
import Input from './Input';
import AssetAutocomplete from './AssetAutocomplete';
import AuthorAutocomplete from './AuthorAutocomplete';
import { setActiveTags } from '../SideBar/Actions';

const CREATED_DATE = 'Created Date';
const LAST_UPDATED_DATE = 'Last Updated Date';
const sortByTypes = {
  [CREATED_DATE]: 'createdTimestamp',
  [LAST_UPDATED_DATE]: 'lastModifiedTimestamp',
};

const propTypes = {
  activeTags: PropTypes.arrayOf(PropTypes.string),
  tags: PropTypes.arrayOf(PropTypes.string),
  sortBy: PropTypes.object,
  onSearchText: PropTypes.func.isRequired,
  onSearchTextChange: PropTypes.func.isRequired,
  onAuthorsSearchTextChange: PropTypes.func.isRequired,
  setActiveTags: PropTypes.func.isRequired,
};

const defaultProps = {
  activeTags: [],
  tags: [],
};

const filterByTagsStyle = {
  popUpComponent: {
    top: 65,
    left: 0,
  },
};

class Search extends React.Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    const { autocomplete, authorsAutocomplete } = props;
    this.state = {
      enterKeyPressed: false,
      searchText: '',
      inputAuthors: '',
      isAutocompleteListShown: autocomplete.length > 0,
      selectedAuthor: {},
      isAuthorsAutocompleteListShown: authorsAutocomplete.length > 0,
      sortBy: sortByTypes[CREATED_DATE],
      activeTags: [],
    };
  }

  componentDidMount() {
    window.addEventListener('click', this.onDOMClick);
  }

  componentWillReceiveProps(nextProps) {
    const { sortBy, activeTags } = nextProps;
    if (sortBy !== this.props.sortBy) {
      this.setState({ sortBy: sortByTypes[sortBy] }, () => {
        // forcedSearch => true
        // since we need to search whenever sortBy has changed
        this.onSearch(true);
      });
    }
    if (activeTags !== this.props.activeTags) {
      this.setState({ activeTags });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onDOMClick);
  }

  onDOMClick = event => {
    if (event.target.name === 'searchText' || event.target.name === 'inputAuthors') {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    this.setState({
      isAutocompleteListShown: false,
      isAuthorsAutocompleteListShown: false,
    });
  };

  handleKeyPress = event => {
    const searchText = this.state.searchText;
    if (searchText.length === 0) {
      return;
    }
    if (event.key === 'Enter') {
      this.onSearch();
    }
  };

  onMenuItemSelect = itemData => {
    this.setState({ sortBy: sortByTypes[itemData.label] });
  };

  onSearch = forcedSearch => {
    const { searchText, sortBy } = this.state;
    const { activeTags } = this.props;
    const authors = this.state.selectedAuthor.id;
    const searchData = {
      searchText: searchText || '*:*',
      authors,
      tags: activeTags && activeTags.join(','),
      sortBy,
    };
    if (forcedSearch) {
      this.props.onSearchText(searchData);
      return;
    }
    if (searchText.length === 0 && activeTags && activeTags.length === 0 && !authors) {
      return;
    }
    this.props.onSearchText(searchData);
    this.setState({
      enterKeyPressed: true,
      isAutocompleteListShown: false,
      isAuthorsAutocompleteListShown: false,
    });
  };

  onTextChange = event => {
    const targetName = event.target.name;
    const targetValue = event.target.value;
    const state = {};
    if (targetName === 'searchText') {
      state.isAutocompleteListShown = targetValue.length > 0;
    } else {
      state.isAuthorsAutocompleteListShown = targetValue.length > 0;
    }

    targetName === 'searchText' && this.props.onSearchTextChange(targetValue);
    targetName === 'inputAuthors' && this.props.onAuthorsSearchTextChange(targetValue);
    this.setState({
      [targetName]: targetValue,
      ...state,
    });
  };

  onInputFocus = event => {
    event.nativeEvent.stopImmediatePropagation();
    const { autocomplete, authorsAutocomplete } = this.props;
    const { searchText, inputAuthors } = this.state;
    const object = {};
    if (event.target.name === 'inputAuthors') {
      object.isAuthorsAutocompleteListShown =
        inputAuthors.length > 0 && authorsAutocomplete.length > 0;
      object.isAutocompleteListShown = false;
    } else {
      object.isAutocompleteListShown = searchText.length > 0 && autocomplete.length > 0;
      object.isAuthorsAutocompleteListShown = false;
    }
    this.setState({
      enterKeyPressed: false,
      ...object,
    });
  };

  onAssetClick = () => {
    this.setState({ isAutocompleteListShown: false });
  };

  onAuthorClick = data => {
    const { searchText } = this.state;
    this.props.onSearchText({ searchText, authors: data.id });
    this.setState({
      isAuthorsAutocompleteListShown: false,
      inputAuthors: data.name,
      selectedAuthor: data,
    });
  };

  onTagCloseClick = label => {
    const searchText = this.state.searchText;
    if (searchText.length > 0) {
      let keywords = searchText.replace(label, '');
      const keywordsLength = keywords.length;
      if (keywordsLength === 0) {
        this.onInputFocus();
      } else {
        keywords = keywords.replace(/\s+/g, ' ').trim();
      }
      if (keywordsLength !== 0) {
        this.props.onSearchText({
          searchText: keywords,
          authors: this.state.selectedAuthor.id,
        });
        this.setState({
          searchText: keywords,
        });
      } else {
        this.setState({
          searchText: '',
          isAutocompleteListShown: false,
        });
      }
    }
  };

  filterByTagsLabel = () => {
    const { activeTags } = this.state;
    const tagsLength = activeTags.length;
    let label = 'No Tags selected';
    if (tagsLength) {
      label = `${tagsLength} Tag${tagsLength > 1 ? 's' : ''} selected`;
    }
    return label;
  };

  render() {
    const filterByTagsLabel = this.filterByTagsLabel();
    const { tags } = this.props;
    return (
      <div styleName="search-bar">
        <div styleName="logo" role="presentation" />
        <div styleName="filter-content">
          <Input
            searchText={this.state.searchText}
            handleKeyPress={this.handleKeyPress}
            onTextChange={this.onTextChange}
            enterKeyPressed={this.state.enterKeyPressed}
            onInputFocus={this.onInputFocus}
            onTagCloseClick={this.onTagCloseClick}
          />
        </div>
        <div styleName="filter-content">
          <DropdownMenu
            label="Authors"
            menus={['All Authors', 'Hello', 'There']}
            inputName="inputAuthors"
            inputValue={this.state.inputAuthors}
            inputType
            onTextChange={this.onTextChange}
            onInputFocus={this.onInputFocus}
          />
        </div>
        <div styleName="filter-content">
          <FilterByTags
            label={filterByTagsLabel}
            tags={tags}
            styles={filterByTagsStyle}
            setActiveTags={this.props.setActiveTags}
          />
        </div>
        <button styleName="search-btn" onClick={this.onSearch}>
          Search
        </button>
        {/*
         TODO: Refactor Autocomplete using AutocompleteWidget
        */}
        <AssetAutocomplete
          assetList={this.props.autocomplete || []}
          onAssetClick={this.onAssetClick}
          show={this.state.isAutocompleteListShown}
        />
        <AuthorAutocomplete
          authorsList={this.props.authorsAutocomplete || []}
          show={this.state.isAuthorsAutocompleteListShown}
          onClick={this.onAuthorClick}
        />
        {/*
        // This is better and cleaner
        <AutocompleteWidget
          dataSource={this.props.autocomplete}
          onRowClick={(rowData) => { console.info('rowData:', rowData); }}
          renderRow={(rowData) => (
            <div>
              <h5>{rowData.assetName}</h5>
            </div>
          )}
        />*/}
      </div>
    );
  }
}

Search.propTypes = {
  autocomplete: React.PropTypes.arrayOf(React.PropTypes.object),
  authorsAutocomplete: React.PropTypes.arrayOf(React.PropTypes.object),
};

Search.defaultProps = {
  autocomplete: [],
  authorsAutocomplete: [],
};

const mapStateToProps = state => ({
  tags: state.dataDiscovery.tags,
  activeTags: state.dataDiscovery.activeTags,
  sortBy: state.dataDiscovery.sortBy,
  autocomplete: state.dataDiscovery.autocomplete,
  authorsAutocomplete: state.dataDiscovery.searchUsersResult,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      setActiveTags,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(Search, styles));
