import { requireNativeView } from 'expo';
import * as React from 'react';

import { EchoWidgetModuleViewProps } from './EchoWidgetModule.types';

const NativeView: React.ComponentType<EchoWidgetModuleViewProps> =
  requireNativeView('EchoWidgetModule');

export default function EchoWidgetModuleView(props: EchoWidgetModuleViewProps) {
  return <NativeView {...props} />;
}
