import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import ReactTooltip from 'react-tooltip';
import './index.css';

const Teams = ({ teams, onTeamClick, selectedTeam }) => {
  // console.info(teams);
  const renderTeamList = () => {
    if (teams && teams.length) {
      return (
        <ul>
          {teams.map(team => (
            <li
              onClick={() => onTeamClick(team)}
              styleName={selectedTeam.id === team.id ? 'active' : null}
            >
              {team.name}
              <span styleName="edit" data-tip data-for={`edit-team-${team.id}`}>
                <i className="icon-pencil" />
                <ReactTooltip
                  id={`edit-team-${team.id}`}
                  type="dark"
                  effect="solid"
                  multiline
                >
                  <span>
                    Edit team
                  </span>
                </ReactTooltip>
              </span>
            </li>
          ))}
        </ul>
      );
    }
    return null;
  };
  const teamsLength = (teams && teams.length) || 0;
  return (
    <div styleName="teams-wrapper">
      <div styleName="header">
        <h5><i className="icon-grid" /> TEAMS <span>({teamsLength})</span></h5>
        <div className="add-team-tooltip">
          <i data-tip data-for="add-team" className="icon-plus" />
          <ReactTooltip id="add-team" type="dark" effect="solid" multiline>
            <span>
              Create new team
            </span>
          </ReactTooltip>
        </div>
      </div>
      {renderTeamList()}
    </div>
  );
};

export default cssModules(Teams, styles);
