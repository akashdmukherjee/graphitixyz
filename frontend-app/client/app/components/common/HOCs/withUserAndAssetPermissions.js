/**
 * withUserAndAssetPermissions makes sure that loggedInUser details,
 * asset details are retreived
 * and decide if it's a new asset or not or is it accessible
 * handle all these things here
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { getLoggedInUserDetails } from '../../Login/Api';
import {
  getAssetDetails,
  checkAssetUserAccessibility,
} from '../../AssetView/Api';

const propTypes = {
  loggedInUser: PropTypes.object,
  assetDetails: PropTypes.object,
  assetUserAccessibility: PropTypes.object,
  params: PropTypes.object.isRequired,
  getLoggedInUserDetails: PropTypes.func.isRequired,
  getAssetDetails: PropTypes.func.isRequired,
  checkAssetUserAccessibility: PropTypes.func.isRequired,
};

const defaultProps = {
  loggedInUser: null,
  assetDetails: null,
  assetUserAccessibility: null,
};

const withUserAndAssetPermissions = Component => {
  class WrappedComponent extends React.Component {
    static propTypes = propTypes;
    static defaultProps = defaultProps;
    constructor(props) {
      super(props);
      const { loggedInUser, params } = props;
      const { assetId } = params;
      this.state = {
        assetId,
        loggedInUser,
      };
      this.data = {
        assetId,
      };
    }

    componentDidMount() {
      this.props.getLoggedInUserDetails();
    }

    componentWillReceiveProps(nextProps) {
      const { loggedInUser, assetDetails, assetUserAccessibility } = nextProps;
      const stateObject = {};
      if (loggedInUser !== this.props.loggedInUser) {
        stateObject.loggedInUser = loggedInUser;
        // now get asset details
        this.data = {
          ...this.data,
          memberId: loggedInUser.id,
          orgId: loggedInUser.organizationId,
        };
        this.props.getAssetDetails({ ...this.data });
        this.props.checkAssetUserAccessibility({ ...this.data });
      }
      if (assetDetails !== this.props.assetDetails) {
        stateObject.assetDetails = assetDetails;
      }
      if (assetUserAccessibility !== this.props.assetUserAccessibility) {
        stateObject.assetUserAccessibility = assetUserAccessibility;
      }
      this.setState(stateObject);
    }

    render() {
      const { loggedInUser, assetDetails, assetUserAccessibility } = this.state;
      const newProps = {
        loggedInUser,
        assetDetails,
        data: this.data,
        assetUserAccessibility,
      };
      return <Component {...newProps} />;
    }
  }
  const mapStateToProps = state => ({
    loggedInUser: state.orgUserVerification.loggedInUser,
    assetDetails: state.dataAssetView.assetDetails,
  });
  const mapDispatchToProps = dispatch =>
    bindActionCreators(
      {
        getAssetDetails,
        getLoggedInUserDetails,
        checkAssetUserAccessibility,
      },
      dispatch
    );
  return connect(mapStateToProps, mapDispatchToProps)(WrappedComponent);
};

export default withUserAndAssetPermissions;
