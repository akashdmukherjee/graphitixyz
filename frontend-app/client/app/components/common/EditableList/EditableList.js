import popUpHOC from '../popUpHOC';
import TriggerComponent from './TriggerComponent';
import PopUpComponent from './PopUpComponent';

const EditableList = ({ triggerComponent }) =>
  popUpHOC(triggerComponent || TriggerComponent, PopUpComponent);
export default EditableList;
