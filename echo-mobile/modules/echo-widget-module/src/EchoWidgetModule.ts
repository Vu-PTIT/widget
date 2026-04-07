import { NativeModule, requireNativeModule } from 'expo';

import { EchoWidgetModuleEvents } from './EchoWidgetModule.types';

declare class EchoWidgetModule extends NativeModule<EchoWidgetModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<EchoWidgetModule>('EchoWidgetModule');
