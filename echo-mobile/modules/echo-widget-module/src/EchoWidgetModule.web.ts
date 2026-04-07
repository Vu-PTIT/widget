import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './EchoWidgetModule.types';

type EchoWidgetModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class EchoWidgetModule extends NativeModule<EchoWidgetModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(EchoWidgetModule, 'EchoWidgetModule');
