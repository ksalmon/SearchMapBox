import React from 'react'
// import SearchMap from './SearchMap'
import theme from './SearchMap.scss'
import { Provider } from '@brickwork-software/react-redux'
import configureMockStore from 'redux-mock-store'
import { IntlProvider } from 'react-intl'
import sinon from 'sinon'
import { MemoryRouter } from 'react-router'

import {storeRegularPlusSpecialHours} from 'data/storeData/exampleData/regularPlusSpecialHours'

xdescribe('SearchMap', () => {

  xit('snapshot', () => {
    const wrapper = shallow(
      <SearchMap
        stores={[storeRegularPlusSpecialHours]}
        selectedStore={storeRegularPlusSpecialHours}
        theme={theme} />
    )
    expect(wrapper).toMatchSnapshot()
  })

  xit('componentDidMount', () => {
    const mockStore = configureMockStore([])
    const store = mockStore({
      location: {
        locating: false, input: '', suggesting: false, suggestions: []
      }
    })
    sinon.spy(SearchMap.prototype, 'componentDidMount')
    const wrapper = mount(
      <IntlProvider locale="en">
        <MemoryRouter initialIndex={0} initialEntries={[{key: 'brickwork'}]}>
          <Provider store={store}>
            <SearchMap theme={theme} />
          </Provider>
        </MemoryRouter>
      </IntlProvider>
    )
    expect(SearchMap.prototype.componentDidMount.calledOnce).toEqual(true)
    expect(wrapper).toMatchSnapshot()
  })

})
