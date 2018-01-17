import React from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import FeatureHighlight from '../FeatureHighlight';


class NewUser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.onDatasetClick = this.onDatasetClick.bind(this);
  }

  onDatasetClick() {
    this.setState({ datasetClicked: true });
  }

  render() {
    let Features = (
      <div styleName="features">
        <FeatureHighlight
          text="SQL Query"
          iconName="sql-icon"
        />
        <FeatureHighlight
          text="Dataset"
          iconName="dataset-icon"
          onClick={this.onDatasetClick}
        />
        <FeatureHighlight
          text="Dashboard"
          iconName="dashboard-icon"
        />
        <FeatureHighlight
          text="R Script"
          iconName="r-icon"
        />
      </div>
    );
    const datasetFeatures = [
        { text: 'Flat File', subtext: 'Upload' },
        { text: 'Postgres Data', subtext: 'Import' },
        { text: 'MySql Data', subtext: 'Import' },
        { text: 'SQL Server Data', subtext: 'Import' },
        { text: 'Oracle Data', subtext: 'Import' },
    ];

    if (this.state.datasetClicked) {
      Features = (
        <div styleName="features">
          {datasetFeatures.map(dataset =>
            <FeatureHighlight
              text={dataset.text}
              subtext={dataset.subtext}
              iconName="sql-icon"
            />
          )}
        </div>
      );
    }
    return (
      <div
        styleName="new-user-wrapper"
      >
        <fieldset>
          <legend>
            <div styleName="gpt-logo"></div>
          </legend>
          <div>
            <h3>Getting started with graphiti</h3>
            <h5>Import all your data assets in one place to streamline your data projects.</h5>
          </div>
          {Features}
          <span styleName="or-line">
            <hr />
            <h5>or</h5>
          </span>
          <button styleName="btn-gpt-team">Create New Team</button>
        </fieldset>
      </div>
    );
  }
}

export default cssModules(NewUser, styles);
