import React from 'react'
import PropTypes from 'prop-types'
import ReactMapboxGl, {Popup, ZoomControl, Marker} from 'react-mapbox-gl'
import {MAPBOX_STYLE_ACCESS_TOKEN, ASIAGO_STYLE_DEFAULT} from '../../containers/services/mapbox'
import {MapPin} from 'components/atoms'
import StoreMapPopup from 'components/StoreMapPopup'
import R from 'ramda'
import mapboxgl from 'mapbox-gl'
import breakpoints from 'styles/breakpoints'
import {querySelector} from 'data/router/selectors'
import HiddenPopup from './HiddenPopup'
import theme from './SearchMap.scss'
import {themed} from 'containers/customization'
import configure from 'data/configure'

const Map = ReactMapboxGl({
  accessToken: MAPBOX_STYLE_ACCESS_TOKEN,
})

function getBoundsFromStores(stores) {
  let bounds = new mapboxgl.LngLatBounds()
  stores.forEach(store => {
    bounds.extend([store.coordinates.longitude, store.coordinates.latitude])
  })
  return bounds.toArray()
}

function equalStoreResults(s1, s2) {
  return (s1.length === s2.length) &&
         (s1.every(store => s2.find(s => s.id === store.id)))
}

function getMapPosition(props) {
  if (props.selectedStore) {
    return {
      center: [
        props.selectedStore.coordinates.longitude,
        props.selectedStore.coordinates.latitude,
      ]
    }
  }
  else if (props.stores.length) {
    return {
      fitBounds: getBoundsFromStores(props.stores),
    }
  }
  else if (props.queryParams.latlng) {
    const [lat, lng] = props.queryParams.latlng.split(',').map(val => parseFloat(val))
    return {
      center: [lng, lat]
    }
  }
  else if (props.geolocation.latitude) {
    return {
      center: [
        props.geolocation.longitude,
        props.geolocation.latitude,
      ]
    }
  }
  return null
}

export const defaultOptions = {
  styleTemplate: 'mapbox://styles/mapbox/streets-v9',
  // mapboxStyle: 'mapbox://styles/mapbox/light-v9',
  pinAnchor: 'bottom',
  popupAnchor: 'bottom',
  popupOffset: [0.1, -20],
  numberPins: false,
}

const anchorPropTypes = PropTypes.oneOf([
  'bottom',
  'top',
  'left',
  'right',
])

export const optionsPropTypes = PropTypes.shape({
  styleTemplate: PropTypes.string,
  pinAnchor: anchorPropTypes,
  popupAnchor: anchorPropTypes,
  popupOffset: PropTypes.array,
  numberPins: PropTypes.bool,
})

export class BaseSearchMap extends React.Component {
  static propTypes = {
    geolocation: PropTypes.shape({
      longitude: PropTypes.number,
      latitude: PropTypes.number
    }),
    zoom: PropTypes.number,
    stores: PropTypes.array.isRequired,
    onMove: PropTypes.func,
    onStoreSelected: PropTypes.func,
    selectedStore: PropTypes.object,
    displayPopup: PropTypes.bool,
    options: optionsPropTypes,
  }

  constructor(props) {
    super(props)
    // If you have a selected store use that for center,
    // If you have stores use those for fitBounds,
    // If you have geolocation use that for center

    this.state = {
      map: null,
      mapInit: null,
      mapImmutable: getMapPosition(this.props)
    }

  }

  hiddenPopupRef = null
  mapRef = null

  static defaultProps = {}

  getStoreCenter(store, popupDimensions) {
    const {
      map,
    } = this.state
    const {
      options: {
        popupAnchor,
        popupOffset,
      },
    } = this.props

    const {longitude, latitude} = store.coordinates

    let center

    const {
      width: popupWidth,
      height: popupHeight,
    } = popupDimensions

    const popupPadding = 20

    if (popupAnchor.includes('left') || popupAnchor.includes('right')) {
      const mapWidth = this.mapRef.container.clientWidth
      const overflow = popupWidth - (mapWidth / 2 - 20)
      if (overflow > 0) {
        const {x, y} = map.project({lng: longitude, lat: latitude})
        const {lng, lat} = map.unproject({
          x: x - overflow - popupPadding,
          y: y + popupOffset[1],
        }) // add an extra 10px padding
        const overflowLng = popupAnchor.includes('left') ? longitude - lng : lng - longitude
        center = [longitude + overflowLng, lat]
      }
      else {
        center = [longitude, latitude]
      }
    }
    else {
      const mapHeight = this.mapRef.container.clientHeight
      const overflow = popupHeight - (mapHeight / 2 - 20)
      if (overflow > 0) {
        const {x, y} = map.project({lng: longitude, lat: latitude})
        const {lng, lat} = map.unproject({
          x: x - popupOffset[0],
          y: y - overflow - popupPadding
        }) // add an extra 10px padding
        const overflowLat = popupAnchor.includes('top') ? latitude - lat : lat - latitude
        center = [lng, latitude + overflowLat]
      }
      else {
        center = [longitude, latitude]
      }
    }

    return center
  }

  handleMapLoaded = (map) => {
    const {
      mapInit,
    } = this.state
    const {
      options: {
        colors,
      }
    } = this.props

    this.setState({
      map,
    })
    // apply custom color to individual layers, e.g. map.setPaintProperty('water', 'fill-color', 'red')
    R.forEachObjIndexed((value, key) => map.setPaintProperty(key, 'fill-color', value), colors)

    if (mapInit) {
      if (mapInit.fitBounds) {
        return map.fitBounds(mapInit.fitBounds, {padding: 40})
      }
      return map.flyTo(mapInit.center)
    }

  }

  handleMarkerClick = (store) => {
    const {
      onStoreSelected,
    } = this.props
    onStoreSelected(store)
  }

  handleClosePopup = () => {
    const {
      onStoreSelected,
    } = this.props
    onStoreSelected()
  }

  componentWillReceiveProps(nextProps) {
    const {
      mapImmutable,
      map,
    } = this.state

    const {
      stores,
      selectedStore,
      queryParams,
    } = this.props

    if (!mapImmutable) {
      return this.setState({
        mapImmutable: getMapPosition(nextProps)
      })
    }
    if (!map) {
      return this.setState({
        mapInit: getMapPosition(nextProps)
      })
    }

    if (nextProps.selectedStore) {
      // NOTE: Let asyncGoToStoreCenter take care of this

    }
    else if (nextProps.stores.length) {
      // If we have stores, we sure as hell have fitBounds.
      const newBounds = getBoundsFromStores(nextProps.stores)

      if (selectedStore) {
        // You closed a selected store
        return map.fitBounds(newBounds, {
          padding: 40
        })
      }

      if (!equalStoreResults(stores, nextProps.stores)) {
        // We have new search results
        return map.fitBounds(newBounds, {
          padding: 40
        })
      }
    }
    else if (queryParams.latlng) {
      const [lat, lng] = queryParams.latlng.split(',').map(val => parseFloat(val))
      return {
        center: [lng, lat]
      }
    }
    else if (stores.length) {
      // We had stores before... so we have no search results.
      // This is the only case we update center to use geolocation or query location
      return map.flyTo([
        nextProps.geolocation.longitude,
        nextProps.geolocation.latitude,
      ])
    }
  }

  renderStoreMapPopup = () => {
    const {
      selectedStore,
      options: {
        popupAnchor,
        popupOffset,
      }
    } = this.props

    if (selectedStore) {
      return (
        <Popup
          key={selectedStore.id}
          coordinates={[selectedStore.coordinates.longitude, selectedStore.coordinates.latitude]}
          anchor={popupAnchor}
          offset={popupOffset}
        >
          <StoreMapPopup
            store={selectedStore}
            onClose={this.handleClosePopup} />
        </Popup>
      )
    }
  }

  asyncGoToStoreCenter = () => {

    const {
      selectedStore,
    } = this.props

    const {
      map,
    } = this.state

    // Get dimensions
    return map.flyTo({
      center: this.getStoreCenter(selectedStore, {
        height: this.hiddenPopupRef.clientHeight + 40,
        width: this.hiddenPopupRef.clientWidth + 40,
      })
    })
  }

  renderHiddenPopup = () => {
    const {
      selectedStore,
    } = this.props

    if (selectedStore) {
      return (
        <HiddenPopup
          popupKey={selectedStore.slug}
          onDimensions={this.asyncGoToStoreCenter}>
          <div ref={(popupRef) => {
            this.hiddenPopupRef = popupRef
          }}>
            <StoreMapPopup
              store={selectedStore}
            />
          </div>
        </HiddenPopup>
      )
    }
  }

  renderZoomControl = () => {
    const {
      screenSize,
    } = this.props

    if (screenSize.width < breakpoints.xs.maxWidth) {
      return (
        <ZoomControl position="bottomLeft" zoomDiff={1} />
      )
    }
    return (
      <ZoomControl zoomDiff={1} />
    )
  }

  renderMapMarkers = () => {
    const {
      stores,
      options: {
        pinAnchor,
        numberPins,
      }
    } = this.props
    return stores.map((store, index) => (
      <Marker
        key={store.id}
        coordinates={[store.coordinates.longitude, store.coordinates.latitude]}
        anchor={pinAnchor}
        onHover={(e) => this.handleMarkerHover(store, 'pointer', e)}
        onEndHover={(e) => this.handleMarkerHover(null, '', e)}
        onClick={() => this.handleMarkerClick(store)}
        style={{cursor: 'pointer'}}>
        <MapPin
          url={store.map_pin.url}
          number={numberPins ? index + 1 : false}
        />
      </Marker>
    ))
  }

  render() {
    const {
      theme,
      options: {
        styleTemplate,
      }
    } = this.props

    const {
      mapImmutable,
    } = this.state

    // So there needs to be no map til we have a geolocation
    // Then we should set that as a center
    // If we **do not** have a store, call fitBounds on style loaded, componentWillReceiveProps
    // if we **do** have a store, call with center

    if (!mapImmutable) {
      return (
        <div />
      )
    }

    return (
      <div className={theme.component}>
        <Map
          pitch={0}
          bearing={0}
          movingMethod="flyTo"
          scrollZoom={false}
          fitBoundsOptions={{
            padding: 40
          }}
          {...mapImmutable}
          preserveDrawingBuffer={true}
          style={styleTemplate || ASIAGO_STYLE_DEFAULT}
          onStyleLoad={this.handleMapLoaded}
          className={theme.reactMapboxGl}
          ref={(mapRef) => {
            this.mapRef = mapRef
          }}
        >
          {this.renderZoomControl()}
          {this.renderMapMarkers()}
          {this.renderStoreMapPopup()}
        </Map>
        {this.renderHiddenPopup()}
      </div>
    )
  }
}

@connect(state => ({
  screenSize: state.screenSize,
  geolocation: state.geolocation,
  queryParams: querySelector(state),
}))
@configure('SearchMap', defaultOptions)
@themed('SearchMap', theme)
export default class SearchMap extends BaseSearchMap {}
