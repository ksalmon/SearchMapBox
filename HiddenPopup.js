import React, {Component} from 'react'
import PropTypes from 'prop-types'

export default class HiddenPopup extends Component {

  static propTypes = {
    children: PropTypes.node.isRequired,
    popupKey: PropTypes.node.isRequired,
    onDimensions: PropTypes.func.isRequired,
  }
  static defaultProps = {}

  componentDidMount() {
    const {
      onDimensions,
    } = this.props
    onDimensions()
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      onDimensions,
      popupKey,
    } = this.props
    if (popupKey !== prevProps.popupKey) {
      onDimensions()
    }
  }

  render() {
    const {
      children,
    } = this.props
    return (
      <div style={{
        position: 'absolute',
        left: -1000,
        top: -1000,
      }}>
        {children}
      </div>
    )
  }
}
