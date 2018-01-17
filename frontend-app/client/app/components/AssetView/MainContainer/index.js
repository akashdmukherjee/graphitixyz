import React from 'react';
import cssModules from 'react-css-modules';
import DataTable from './DataTable';
import styles from './index.styl';
import './index.css';
import './splitpane.css';
import Loader from '../../common/Loader';

const SideBarWidth = 250;
class MainContainer extends React.Component {
  static propTypes = {
    apiData: React.PropTypes.object.isRequired,
    isSideBarOpened: React.PropTypes.bool.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      getDataResult: props.getDataResult,
      isDataLoading: true,
    };
    this.isSideBarOpened = props.isSideBarOpened;
  }

  componentDidMount() {
    setTimeout(() => {
      this.onMainContainerLoad();
    }, 0);
  }

  componentWillReceiveProps(nextProps) {
    // console.info(nextProps);
    const { isSideBarOpened, getDataResult } = nextProps;
    // This comparison is needed to detect
    // if the change is because of the menu toggling or not
    if (isSideBarOpened === false || isSideBarOpened) {
      this.isSideBarOpened !== isSideBarOpened && this.onMainContainerResize(isSideBarOpened);
      this.isSideBarOpened = isSideBarOpened;
    }
    if (getDataResult !== this.props.getDataResult) {
      this.setState({ getDataResult, isDataLoading: false });
    }
  }

  onMainContainerLoad = () => {
    const { clientWidth, clientHeight } = this.mainContainer;
    this.setState({
      width: clientWidth,
      height: clientHeight,
    });
  };

  // this way you could avoid
  // writing bindings on constructor
  onMainContainerResize = isSideBarOpened => {
    const { clientWidth, clientHeight } = this.mainContainer;
    // console.info('Before:', clientWidth, clientHeight);
    this.setState(
      {
        width: isSideBarOpened ? clientWidth - SideBarWidth : clientWidth + SideBarWidth,
        height: clientHeight,
      },
      () => {
        console.info('After:', this.state);
      }
    );
  };

  renderDataGrid = () => {
    const { getDataResult, width, height } = this.state;
    if (getDataResult && getDataResult.length) {
      return <DataTable width={width} height={height} getDataResult={getDataResult} />;
    }
    return null;
  };

  render() {
    const { onRefreshDataButtonClick, isDirty, expandFilters, apiData } = this.props;
    const { width, height, isDataLoading } = this.state;
    return (
      <div
        styleName="main-container-wrapper"
        style={{
          display: expandFilters ? 'none' : 'flex',
        }}
        ref={ref => {
          this.mainContainer = ref;
        }}
      >
        {isDataLoading ? <Loader style={{ width: '100%' }} /> : null}
        {isDirty
          ? <button onClick={onRefreshDataButtonClick}>
              <i className="icon-refresh" /> Refresh Data
            </button>
          : null}
        {/* <TreeDiagram apiData={apiData} width={width} height={height - 10} /> */}
        {this.renderDataGrid()}
      </div>
    );
  }
}

export default cssModules(MainContainer, styles);
