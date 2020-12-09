// Legacy Code - To Refactor
import legacyApp from './legacy';

// Actions
import configMenu from './actions/configMenu';

export default () => {
  legacyApp.initialise();

  configMenu();
};