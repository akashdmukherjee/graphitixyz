import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const generateRandomId = () => Math.random().toString().slice(3, 10);

const propTypes = {
  assetId: PropTypes.string,
  orgId: PropTypes.string,
  memberId: PropTypes.string,
  notes: PropTypes.arrayOf(PropTypes.object),
  addNote: PropTypes.func.isRequired,
};
const defaultProps = {
  notes: [],
  assetId: '',
  memberId: '',
  orgId: '',
};

class Notes extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    this.state = {
      notes: props.notes,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { notes } = nextProps;
    if (notes !== this.props.notes) {
      this.setState({ notes });
    }
  }

  handleInputChange = event => {
    const targetName = event.target.name;
    const targetValue = event.target.value;
    this.setState({ [targetName]: targetValue }, () => {
      // console.info(this.state);
    });
  };

  onAddNote = () => {
    const { notes, note } = this.state;
    const { memberId, assetId, orgId, addNote } = this.props;
    const newNotes = [{ content: note, id: generateRandomId() }, ...notes];

    // call network api
    addNote({
      memberId,
      assetId,
      orgId,
      content: note,
    });

    this.setState({
      notes: newNotes,
      note: '',
    });
  };

  renderNotes = () => {
    const { notes } = this.state;

    return notes.map(note => (
      <div styleName="note" key={note.id}>
        <p>{note.content}</p>
      </div>
    ));
  };

  render() {
    const { note } = this.state;
    return (
      <div styleName="note-modal-wrapper">
        <div styleName="note-editables">
          <div>
            <h5>Note:</h5>
            <textarea
              styleName="note-input"
              rows="3"
              name="note"
              value={note}
              onChange={this.handleInputChange}
            />
          </div>
          <div styleName="add-btn-wrapper">
            <button onClick={this.onAddNote}>Add Note</button>
          </div>
        </div>
        <div styleName="notes">
          {this.renderNotes()}
        </div>
      </div>
    );
  }
}

export default cssModules(Notes, styles);
