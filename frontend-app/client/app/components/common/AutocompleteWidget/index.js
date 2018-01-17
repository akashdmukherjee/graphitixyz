import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

class AutocompleteWidget extends React.Component {
  static propTypes = {
    dataSource: PropTypes.arrayOf(PropTypes.object).isRequired,
    iconName: PropTypes.string,
    text: PropTypes.string,
    subtext: PropTypes.string,
    renderRow: PropTypes.func,
    onRowClick: PropTypes.func,
  };
  state = {};

  renderRow = ({ rowData, onRowClick, iconName, text, subtext }) => (
    <li onClick={() => onRowClick(rowData)} key={rowData.id}>
      {iconName
        ? <div styleName="icon-wrapper">
            <i className={iconName} />
          </div>
        : null}
      <div styleName="row-metas">
        <h5>{text}</h5>
        <h5>{subtext}</h5>
      </div>
    </li>
  );

  renderAutocompleteList = ({ dataSource, renderRow, onRowClick }) => {
    if (dataSource && dataSource.length) {
      return (
        <ul styleName="autocomplete-wrapper">
          {dataSource.map(rowData => {
            if (renderRow) {
              return (
                <li
                  onClick={e => {
                    onRowClick(rowData);
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                >
                  {renderRow(rowData)}
                </li>
              );
            }
            return this.renderRow(rowData);
          })}
        </ul>
      );
    }
    return null;
  };

  render() {
    return this.renderAutocompleteList(this.props);
  }
}

export default cssModules(AutocompleteWidget, styles);
