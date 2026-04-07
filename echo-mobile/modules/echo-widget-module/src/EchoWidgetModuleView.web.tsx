import * as React from 'react';

import { EchoWidgetModuleViewProps } from './EchoWidgetModule.types';

export default function EchoWidgetModuleView(props: EchoWidgetModuleViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
