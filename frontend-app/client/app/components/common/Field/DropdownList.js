import Dropdown from './Dropdown';
import Trigger from './Trigger';
import popUpHOC from '../popUpHOC';

const DropdownList = popUpHOC(Trigger, Dropdown);

export default DropdownList;
