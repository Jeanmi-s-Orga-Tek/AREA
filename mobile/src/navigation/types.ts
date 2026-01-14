import type {AreaDetail} from '../api/areas';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Areas: undefined;
  CreateArea: {area?: AreaDetail} | undefined;
  Settings: undefined;
};
