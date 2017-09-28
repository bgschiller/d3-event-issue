import * as d3 from 'd3';
import * as d3Selection from 'd3-selection';

document.body.onload = function () {
  document.body.style.backgroundColor ='blue';
  window.onerror = function() {
    document.body.style.backgroundColor = 'red';
  }

  d3Selection.event = 'twelve';
  if (d3.event === 'twelve') {
    document.body.style.backgroundColor ='blue';
  }
};
