import React from 'react';
import cssModules from 'react-css-modules';
import Select from 'react-select';

import styles from './aboutYourOrg.styl';
import '../../styles/react-select.css';

const ORG_SIZE = [
  { label: 'Less than 100 Employees', value: 100 },
  { label: '100 to 500 Employees', value: 500 },
  { label: '500 to 5000 Employees', value: 5000 },
  { label: '5000 to 20000 Employees', value: 20000 },
  { label: 'Greater Than 20000 Employees', value: 21000 },
];

const FEATURES = [
  { label: 'Data Governance', value: 'Data Governance' },
  { label: 'Data Asset Discovery', value: 'Data Asset Discovery' },
  { label: 'Consistency', value: 'Consistency' },
  { label: 'Data Collaboration', value: 'Data Collaboration' },
  { label: 'Version Control', value: 'Version Control' },
  { label: 'Historical Data Management', value: 'Historical Data Management' },
  { label: 'Data Project Management', value: 'Data Project Management' },
  { label: 'Data Exploration', value: 'Data Exploration' },
  { label: 'Rapid Data Visualization', value: 'Rapid Data Visualization' },
  { label: 'Data Storytelling', value: 'Data Storytelling' },
  { label: 'Conversations on Data', value: 'Conversations on Data' },
];

const AboutYourOrg = (props) => {
  let {
    email,
    orgSize,
    orgName,
    dnsDomain,
    error,
    serviceValue,
    handleChange,
    isValidEmail,
    handleSelectChange,
    handleBlur,
    handleFocus,
    onOrgSignUp,
  } = props;
  let Icon;
  let ValidationMessage = null;

  if (isValidEmail !== null && error) {
    Icon = isValidEmail ? <i className="fa fa-check" styleName="input-icon-correct"></i>
          : <i className="fa fa-times" styleName="input-icon-error"></i>;
    if (!isValidEmail || error) {
      ValidationMessage = error ? <small styleName="error">{error.message}<br /></small> :
        <small styleName="error">{email} is not a valid email.<br /></small>;
    }
  }

  return (
    <div>
      <div styleName="top-headings">
        <h2 styleName="text-intro">
          <span style={{ fontWeight: 'normal' }}>About your </span>
          Organization
        </h2>
        <h3 styleName="text-sub-intro">
          Tell us a little more about your organization
        </h3>
      </div>
      <div styleName="email-form">
        <div styleName="inp-field">
          <h2 styleName="input-label">Org Name:</h2>
          <input
            type="text"
            autoComplete="off"
            styleName="inp-field-gpt-disabled"
            placeholder="Amazon"
            name="orgName"
            value={orgName}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled
          />
        </div>
        <div styleName="inp-field">
          <input
            type="text"
            autoComplete="off"
            styleName="inp-field-gpt-disabled"
            placeholder="amazon.graphiti.xyz"
            name="dnsDomain"
            value={dnsDomain}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled
          />
        </div>
        <div styleName="inp-field">
          <Select
            styleName="select-me"
            name="form-field-name"
            placeholder="How big is your Organization?"
            value={orgSize}
            clearable={false}
            options={ORG_SIZE}
            onChange={(val) => handleSelectChange('orgSize', val.value)}
          />
          {Icon}
          <div styleName="subtext">
            {ValidationMessage}
          </div>
        </div>
        <div styleName="inp-field">
          <Select
            styleName="select-me"
            name="form-field-name"
            placeholder="What do you want graphiti to help you with?"
            multi
            value={serviceValue}
            options={FEATURES}
            onChange={(val) => handleSelectChange('serviceValue', val)}
          />
        </div>
        <div styleName="button-wrapper">
          <button name="2" styleName="btn-gpt" onClick={onOrgSignUp}>NEXT</button>
        </div>

      </div>
    </div>
  );
};

AboutYourOrg.propTypes = {
  email: React.PropTypes.string.isRequired,
  orgName: React.PropTypes.string,
  dnsDomain: React.PropTypes.string,
  error: React.PropTypes.object,
  handleChange: React.PropTypes.func.isRequired,
  handleBlur: React.PropTypes.func.isRequired,
  handleFocus: React.PropTypes.func.isRequired,
  onOrgSignUp: React.PropTypes.func.isRequired,
  handleSelectChange: React.PropTypes.func.isRequired,
  isValidEmail: React.PropTypes.bool,
  orgSize: React.PropTypes.number.isRequired,
  serviceValue: React.PropTypes.array.isRequired,
};

export default cssModules(AboutYourOrg, styles);
