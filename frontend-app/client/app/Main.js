import React from 'react';
import { DragDropContext as dragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

// Main component which is the base for all components imported by React Router
// Here we attach DnD drop context.
// HTML5Backend is needed for proper DnD functionality

// We need 'class' for dnd context
// eslint-disable-next-line
class Main extends React.Component {
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}

Main.propTypes = {
  children: React.PropTypes.element.isRequired,
};

export default dragDropContext(HTML5Backend)(Main);
