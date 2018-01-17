import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import MonacoEditor from 'react-monaco-editor/';
import styles from './test.styl';
import DataGrid from './AssetView/MainContainer/DataGrid';
import SQLEditor from './common/SQLEditor/SQLEditor';
import popUpHOC from './common/popUpHOC';
import Timeline from './common/Timeline';
import userAuthHOC from './common/HOCs/userAuthHOC';

const TriggerComponent = ({ onClick }) => <div onClick={onClick}>Trigger</div>;

const PopUpComponent = ({ onItemSelect }) => (
  <ul>
    <li onClick={() => onItemSelect('Bike')}>Bike</li>
    <li onClick={() => onItemSelect('Movie')}>Movie</li>
    <li onClick={() => onItemSelect('Bicycle')}>Bicycle</li>
  </ul>
);

const PopUpList = popUpHOC(TriggerComponent, PopUpComponent);

class AssetCreator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div styleName="asset-creator-wrapper">
        <div styleName="asset-editor">
          <div styleName="header-btn-wrapper">
            <h5>Write Query</h5>
            <button>Run</button>
          </div>
          <SQLEditor
            style={{
              width: '86%',
              margin: 10,
            }}
          />
        </div>
      </div>
    );
  }
}

export default cssModules(userAuthHOC(AssetCreator, false), styles);
