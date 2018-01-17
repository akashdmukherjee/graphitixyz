// Resizable element wrapper helper

import React from 'react';
import cssModules from 'react-css-modules';
import style from './resizable-element.styl';
import ResizableHandler from './ResizableHandler';
import { connect as reduxConnect } from 'react-redux';

const ResizableElement = (props) => {
  const {
    children,
    parentId,
    borderWidth,
    borderHeight,
    boxId,
    objectResizableSizes,
    expanded,
  } = props;
  const getBorderStyles = () => {
    const currentBoxBorder = objectResizableSizes.find(b => b.boxId === boxId);
    if (currentBoxBorder) {
      return {
        width: expanded ? '100%' : (currentBoxBorder.width || borderWidth - 2),
        height: expanded ? '100%' : (currentBoxBorder.height || borderHeight - 2),
        top: expanded ? 0 : (currentBoxBorder.top || 0),
        left: expanded ? 0 : (currentBoxBorder.left || 0),
        zIndex: currentBoxBorder.zIndex || 0,
      };
    }
    return {
      width: expanded ? '100%' : borderWidth - 2,
      height: expanded ? '100%' : borderHeight - 2,
      top: 0,
      left: 0,
      zIndex: 0,
    };
  };
  return (
    <div styleName="resizable-element">
      <div styleName="resizable-border" style={getBorderStyles()}></div>
      <ResizableHandler type="top-left" parentId={parentId} />
      <ResizableHandler type="top" parentId={parentId} />
      <ResizableHandler type="top-right" parentId={parentId} />
      <ResizableHandler type="left" parentId={parentId} />
      <ResizableHandler type="right" parentId={parentId} />
      <ResizableHandler type="bottom-left" parentId={parentId} />
      <ResizableHandler type="bottom" parentId={parentId} />
      <ResizableHandler type="bottom-right" parentId={parentId} />
      <div styleName="resizable-content">
        {children}
      </div>
    </div>
  );
};

ResizableElement.propTypes = {
  children: React.PropTypes.element.isRequired,
  parentId: React.PropTypes.string.isRequired,
  borderWidth: React.PropTypes.number.isRequired,
  borderHeight: React.PropTypes.number.isRequired,
  boxId: React.PropTypes.string.isRequired,
  objectResizableSizes: React.PropTypes.array.isRequired,
  expanded: React.PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({
  objectResizableSizes: state.objectResizableSizes,
});

export default reduxConnect(mapStateToProps)(cssModules(ResizableElement, style));
