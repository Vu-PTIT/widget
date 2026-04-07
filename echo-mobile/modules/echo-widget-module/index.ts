// Reexport the native module. On web, it will be resolved to EchoWidgetModule.web.ts
// and on native platforms to EchoWidgetModule.ts
export { default } from './src/EchoWidgetModule';
export { default as EchoWidgetModuleView } from './src/EchoWidgetModuleView';
export * from  './src/EchoWidgetModule.types';
