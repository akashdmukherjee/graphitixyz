import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import SearchableInput from '../../../common/SearchableInput';
import Tag from '../../../common/Tag';
import Modal from '../../../common/Modal';

const propTypes = {
  name: PropTypes.string,
  teamId: PropTypes.string,
  loggedInUser: PropTypes.object,
  searchUsersResult: PropTypes.arrayOf(PropTypes.object),
  teamMembers: PropTypes.arrayOf(PropTypes.object),
  open: PropTypes.bool,
  updateTeamMembers: PropTypes.bool.isRequired,
  onUserSelect: PropTypes.func.isRequired,
  searchUsersByName: PropTypes.func.isRequired,
  createTeam: PropTypes.func.isRequired,
  updateTeam: PropTypes.func.isRequired,
};

const defaultProps = {
  name: '',
  teamId: '',
  loggedInUser: {},
  searchUsersResult: [],
  open: false,
  teamMembers: [],
  onUserSelect: () => null,
};

class TeamManagement extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    this.state = {
      teamMember: '',
      teamname: props.name,
      fieldsChanged: false,
      open: props.open,
      teamMembers: props.teamMembers,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { name, open, teamMembers } = nextProps;
    const object = {};
    if (name !== this.props.name) {
      object.teamname = name;
    }
    if (open !== this.props.open) {
      object.open = open;
    }
    if (teamMembers !== this.props.teamMembers) {
      object.teamMembers = teamMembers;
    }
    this.setState(object);
  }

  onChangeText = event => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
    if (name === 'teamname') return;
    const { loggedInUser } = this.props;

    /**
     * set header `onlyMembers` to true
     * to get only Members
     */
    const data = {
      query: value,
      memberId: loggedInUser.id,
      orgId: loggedInUser.organizationId,
      headers: {
        onlyMembers: true,
      },
    };
    this.props.searchUsersByName(data);
  };

  onUserSelect = (inputName, item) => {
    const { teamMembers } = this.state;
    const newteamMembers = [...teamMembers, { id: item.id, name: item.name }];
    this.setState(
      {
        teamMembers: newteamMembers,
        teamMember: '',
        fieldsChanged: true,
      },
      () => {
        // console.info('teamMembers', newteamMembers);
      }
    );
    this.props.onUserSelect(item);
  };

  handleClose = () => {
    this.props.onClose();
  };

  handleHeaderButtonClick = () => {
    const { loggedInUser, updateTeamMembers, teamId } = this.props;
    const { teamname, teamMembers } = this.state;
    const data = {
      orgId: loggedInUser.organizationId,
      memberId: loggedInUser.id,
      teamId,
      body: {
        name: teamname,
        organizationId: loggedInUser.organizationId,
        members: teamMembers,
      },
    };
    if (updateTeamMembers) {
      this.props.updateTeam(data);
    } else {
      this.props.createTeam(data);
    }
  };

  handleTagCloseClick = data => {
    const teamMembers = this.state.teamMembers.slice();
    const matchIndex = teamMembers.filter(
      teamMember => teamMember.id === data.id
    );
    if (matchIndex !== -1) {
      teamMembers.splice(matchIndex, 1);
      this.setState({ teamMembers, fieldsChanged: true });
    }
  };

  renderteamMembers = () => {
    const { teamMembers } = this.state;
    return teamMembers.map(selectedUser => (
      <Tag
        label={selectedUser.name}
        key={selectedUser.id}
        onTagCloseClick={this.handleTagCloseClick}
      />
    ));
  };

  render() {
    const { teamMember, teamname, fieldsChanged, open } = this.state;
    const { searchUsersResult, updateTeamMembers } = this.props;
    return (
      <Modal
        open={open}
        modalName="Asset Name"
        header="Teams"
        headerButtonText={updateTeamMembers ? 'Update Team' : 'Create Team'}
        fieldsChanged={fieldsChanged}
        onClose={this.handleClose}
        onHeaderButtonClick={this.handleHeaderButtonClick}
      >
        <div styleName="team-management-wrapper">
          <input
            type="text"
            name="teamname"
            placeholder="Team Name"
            value={teamname}
            onChange={this.onChangeText}
          />
          <div styleName="team-wrapper">
            <div styleName="header-teams"><h5>Team Members</h5></div>
            <div styleName="team-tags">
              {this.renderteamMembers()}
              <SearchableInput
                name="teamMember"
                text={teamMember}
                dataSource={searchUsersResult}
                focused
                onUserSelect={this.onUserSelect}
                onChangeText={this.onChangeText}
              />
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default cssModules(TeamManagement, styles);
