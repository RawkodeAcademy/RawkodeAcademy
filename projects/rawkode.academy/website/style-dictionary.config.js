import StyleDictionary from 'style-dictionary';

const config = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          selector: ':root',
          options: {
            outputReferences: true
          }
        }
      ]
    },
    js: {
      transformGroup: 'js',
      buildPath: 'src/lib/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6'
        }
      ]
    }
  }
};

// Register custom formats
StyleDictionary.registerFormat({
  name: 'tailwind/js',
  formatter: function(dictionary) {
    const tokens = dictionary.allTokens;
    const tailwindConfig = {
      theme: {
        extend: {
          colors: {},
          spacing: {},
          borderRadius: {},
          fontFamily: {},
          boxShadow: {},
          transitionDuration: {}
        }
      }
    };

    tokens.forEach(token => {
      const { path, value } = token;
      
      if (path[0] === 'global') {
        switch (path[1]) {
          case 'color':
            tailwindConfig.theme.extend.colors[path[2]] = value;
            break;
          case 'spacing':
            tailwindConfig.theme.extend.spacing[path[2]] = value;
            break;
          case 'radius':
            tailwindConfig.theme.extend.borderRadius[path[2]] = value + 'px';
            break;
          case 'font':
            tailwindConfig.theme.extend.fontFamily[path[2]] = value.split(', ');
            break;
          case 'shadow':
            tailwindConfig.theme.extend.boxShadow[path[2]] = value;
            break;
          case 'duration':
            tailwindConfig.theme.extend.transitionDuration[path[2]] = value;
            break;
        }
      } else if (path[0] === 'semantic') {
        // Handle semantic tokens
        const tokenName = path[1];
        if (tokenName.startsWith('color-')) {
          const colorName = tokenName.replace('color-', '');
          tailwindConfig.theme.extend.colors[colorName] = value;
        }
      }
    });

    return `/* Design Tokens for Tailwind CSS */
export default ${JSON.stringify(tailwindConfig, null, 2)};`;
  }
});

// Add the tailwind format to the js platform
config.platforms.tailwind = {
  transformGroup: 'js',
  buildPath: 'src/lib/',
  files: [
    {
      destination: 'tailwind-tokens.js',
      format: 'tailwind/js'
    }
  ]
};

export default config;