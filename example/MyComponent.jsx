'use strict';

var React = require('react');

require('./MyComponent.css');

var MyComponent = React.createClass({
  handleClick: function() {
    alert('hi');
  },
  render: function() {
    return (
      <div className="MyComponent" onClick={this.handleClick}>Hello, world!!!!!!</div>
    );
  },
});

module.exports = MyComponent;