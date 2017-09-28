import * as d3 from 'd3';

document.body.onload = function () {
  document.body.style.backgroundColor ='blue';
  window.onerror = function() {
    document.body.style.backgroundColor = 'red';
  }

  d3.event = 'twelve';
  if (d3.event === 'twelve') {
    document.body.style.backgroundColor ='blue';
  }
};
