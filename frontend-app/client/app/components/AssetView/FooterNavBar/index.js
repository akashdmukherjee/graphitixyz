import React from 'react';
import ReactDOM from 'react-dom';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import ReactTooltip from 'react-tooltip';

class FooterNavBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.refs.active.focus();
  }

  render() {
    return (
      <div styleName="fnb-main-wrapper">
        <ul styleName="action-modes">
          <li>
            <a href="#" data-tip data-for="preview-mode">
              <i className="fa fa-eye fa-2x" />
            </a>
            <ReactTooltip
              id="preview-mode"
              type="dark"
              effect="solid"
              multiline
            >
              <span>
                PREVIEW MODE
                <br />
                <small style={{ color: 'grey' }}>View & Interact</small>
              </span>
            </ReactTooltip>
          </li>
          <li>
            <a href="#" data-tip data-for="edit-mode">
              <i className="fa fa-pencil-square-o fa-2x" />
            </a>
            <ReactTooltip id="edit-mode" type="dark" effect="solid">
              <span>
                EDIT MODE
                <br />
                <small style={{ color: 'grey' }}>View & Interact</small>
              </span>
            </ReactTooltip>
          </li>
          <li>
            <a href="#" data-tip data-for="explore-mode" ref="active">
              <i className="fa fa-clock-o fa-2x" />
            </a>
            <ReactTooltip id="explore-mode" type="dark" effect="solid">
              <span>
                WORKING COPIES
                <br />
                <small style={{ color: 'grey' }}>View & Interact</small>
              </span>
            </ReactTooltip>
          </li>
          <li>
            <a href="#" data-tip data-for="history-mode">
              <i className="fa fa-bar-chart fa-2x" />
            </a>
            <ReactTooltip id="history-mode" type="dark" effect="solid">
              <span>
                HISTORY MODE
                <br />
                <small style={{ color: 'grey' }}>View & Interact</small>
              </span>
            </ReactTooltip>
          </li>
          <li>
            <a href="#" data-tip data-for="related-assets-mode">
              <i className="fa fa-codiepie fa-2x" />
            </a>
            <ReactTooltip
              id="related-assets-mode"
              type="dark"
              effect="solid"
              multiline
            >
              <span>
                RELATED ASSETS
                <br />
                <small style={{ color: 'grey' }}>View & Interact</small>
              </span>
            </ReactTooltip>
          </li>
        </ul>
      </div>
    );
  }
}

export default cssModules(FooterNavBar, styles);
