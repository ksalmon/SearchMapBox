import React, {Component} from 'react'

const isMapGLEnabled = () => {
  // TODO: Need a more robust feature detection with Modernizr (needs to be integrated into asiago-scripts)
  // For now just check if executing in Phantom.js environment, which does not support WebGL
  // Phantom.js is used to prerender a page for SEO
  // See http://engineering.shapesecurity.com/2015/01/detecting-phantomjs-based-visitors.html to techniques
  if (window.callPhantom || window._phantom) {
    console.log('Executing in phantom.js')
    return false
  } else {
    return true
  }
}

const lazyLoadedComponent = (importPromiseFactory) => {
  return class extends React.Component {
    state = {
      loaded: false
    }

    load = () => {
      importPromiseFactory((exports) => {
        Promise.resolve(exports)
          .then(exports => exports.default || exports)
          .then(component => this.setState({ loaded: true, component }))
          .catch(err => this.setState({ loaded: false, error: err }))

      })
    }

    componentDidMount() {
      this.load()
    }

    render() {
      if (!this.state.loaded) return null
      const Component = this.state.component
      return <Component {...this.props}/>
    }
  }
}

// There may be more elegant way to lazily load a chunk of code using ES2015 dynamic imports, but babel complains it does not understand it
// Stick with webpack's require.ensure(...) for now. require.ensure is also used to load code split locale data.
const SearchMap = lazyLoadedComponent((loaded) => require.ensure([], (require) => loaded(require('./SearchMap')), 'searchMap'))
export default class BundledSearchMap extends Component {
  render() {
    if (isMapGLEnabled()) {
      return <SearchMap {...this.props} />
    }
    return <div />
  }
}
