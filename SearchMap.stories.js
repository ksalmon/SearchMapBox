import React from 'react'
import {select, number, boolean, object} from '@storybook/addon-knobs'
import {storiesOf} from '@storybook/react'
import SearchMap, {defaultOptions} from './SearchMap'
import withReadme from '@brickwork-software/storybook-addon-readme/with-readme'
import Readme from './SearchMap.readme.md'

import theme from './SearchMap.scss'

import stores from 'src/data/storeData/exampleData/newYorkStores'

let selectedStore
function handleStoreSelected(store) {
  selectedStore = store
}

storiesOf('SearchMap', module)
  .addDecorator(withReadme(Readme))
  .add('Default', () => {

    // TODO: styleTemplate should become mapboxStyle like StaticMap
    // And just use the styleId like StaticMap, not including mapbox://styles/
    const options = {
      styleTemplate: select('styleTemplate', [
        defaultOptions.styleTemplate,
        'mapbox://styles/mapbox/light-v9',
        'mapbox://styles/cdanzig/cj4fzgszm0qlt2smtyj7pjcbj',
        'mapbox://styles/cdanzig/cj47huvne0yhk2smmao5vj3cs',
        'mapbox://styles/mapbox/outdoors-v9',
        'mapbox://styles/mapbox/dark-v9',
        'mapbox://styles/mapbox/satellite-v9',
        'mapbox://styles/mapbox/satellite-streets-v9',
      ], defaultOptions.styleTemplate),
      pinAnchor: select('pinAnchor', [
        'bottom',
        'top',
        'right',
        'left',
      ], 'bottom'),
      popupAnchor: select('popupAnchor', [
        'bottom',
        'top',
        'right',
        'left',
      ], 'left'),
      popupOffset: [
        number('popupOffset[0]', 0),
        number('popupOffset[1]', -20),
      ],
      numberPins: boolean('numberPins', false)
    }

    return (
      <div style={{
        height: 400,
        width: '100%'
      }}>
        <SearchMap
          theme={theme}
          screenSize={{
            width: window.innerWidth,
            height: window.innerHeight,
          }}
          onStoreSelected={handleStoreSelected}
          options={object('SearchMap Options', options) }
          selectedStore={selectedStore}
          stores={stores} />
      </div>
    )
  })
