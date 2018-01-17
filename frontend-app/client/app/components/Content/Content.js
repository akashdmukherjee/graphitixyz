// Main website component
// Here we connect out all smaller components

import React from 'react';
import cssModules from 'react-css-modules';
import style from './content.styl';
import DataStoriesList from './DataStoriesList';

class Content extends React.Component {
  constructor(props) {
    /* Note props is passed into the constructor in order to be used */
    super(props);
    this.state = {
      datastoriesList: [
        { id: 1, name: 'Sales Report Q2', creator: 'geetish' },
        { id: 2, name: 'Sales Report Q3', creator: 'akash' },
        { id: 3, name: 'Sales Report Q4', creator: 'pratik' },
      ],
    };
  }
  render() {
    return (
      <div styleName="main-container">
        <div styleName="static-top-menu">
          <div styleName="logo">
            graphiti
          </div>
          <div>
            <input
              type="text"
              styleName="searchbar"
              name="search"
              placeholder="Search for business questions, stories, charts, datasets and more"
            />
          </div>
        </div>
        <div styleName="content-navigation-quickfilters">
          <div styleName="quickfilters"> My Data Stories </div>
          <div styleName="quickfilters"> Created by Me </div>
          <div styleName="quickfilters"> Recently Edited </div>
        </div>
        <div styleName="content-navigation-main-area">
          <DataStoriesList datastoriesList={this.state.datastoriesList} />
        </div>
      </div>
    );
  }
}

// we use react-css-modules for styling,
// we need to compose style object with the component
// it will appear in almost all components
export default cssModules(Content, style);
