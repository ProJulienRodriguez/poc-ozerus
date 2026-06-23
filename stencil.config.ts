import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'ozerus-ds',
  srcDir: 'design-system',
  globalStyle: 'design-system/global/tokens.css',
  sourceMap: true,
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null,
      copy: [{ src: 'index.html' }],
    },
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
