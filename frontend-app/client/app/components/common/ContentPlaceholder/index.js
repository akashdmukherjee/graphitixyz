import React from 'react';
import './index.css';

const ContentPlaceholder = () =>
  <div className="asset-placeholder">
    <div className="animated-background">
      <div className="background-masker header-top" />
      <div className="background-masker header-left" />
      <div className="background-masker header-right" />
      <div className="background-masker header-bottom" />
      <div className="background-masker subheader-left" />
      <div className="background-masker subheader-right" />
      <div className="background-masker subheader-bottom" />
      <div className="background-masker footer-left" />
      <div className="background-masker footer-middle" />
      <div className="background-masker footer-right" />
      <div className="background-masker footer-bottom" />
    </div>
  </div>;

export default ContentPlaceholder;
