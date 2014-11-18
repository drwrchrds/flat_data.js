function Dashboard(el, details, data) {
  this.dataByDate = this.breakOutDataByDate(data);
  
  this.el = el;
  this.details = details;
  this.currentView = {
    property: 'sold',
    showCombined: true,
    showPercent: true
  };
}

Dashboard.prototype.columns = function () {
  if(!this._columns) {
    this._columns = _.keys(this.dataByDate[_.keys(this.dataByDate)[0]]);
  }
  return this._columns;
};

Dashboard.percentOptions = {
  scaleOverride: true,
  scaleSteps: 5,
  scaleStepWidth: 20,
  scaleStartValue: 0,
  scaleLabel: "<%= value %>%",
  tooltipTemplate: '<%if (datasetLabel){%><%=datasetLabel%>: <%}%><%= value.toFixed(2) %>%',
  multiTooltipTemplate: '<%if (datasetLabel){%><%=datasetLabel%>: <%}%><%= value.toFixed(2) %>%'
};

Dashboard.defaultOptions = {
  animationSteps: 20,
  scaleOverride: false,
  scaleFontFamily: "'Helvetica', 'Arial', sans-serif",
  scaleFontSize: 12,
  scaleFontStyle: "100",
  scaleFontColor: "rgba(44, 62, 80,1.0)",
  tooltipCornerRadius: 0,
  tooltipTemplate: '<%if (datasetLabel){%><%=datasetLabel%>: <%}%><%= value %>',
  multiTooltipTemplate: '<%if (datasetLabel){%><%=datasetLabel%>: <%}%><%= value %>'
};

Dashboard.detailTemplate =  
      _.template(document.getElementById('template-detail').innerHTML);

Dashboard.prototype.chartOptions = function () {
  var options = _.assign({
    onAnimationComplete: this.renderDetails.bind(this) 
  }, Dashboard.defaultOptions);

  if (this.currentView.showPercent) {
    return _.merge(options, Dashboard.percentOptions);
  } else {
    return options;
  }
};

Dashboard.prototype.flowers = function () {
  return _.without(this.columns(), 'combined unit');
};

Dashboard.prototype.colorDefaults = function () {
  if (!this._colorDefaults) {
    this._colorDefaults = {};
    var colors = [
      [155, 89, 182],
      [241, 196, 15],
      [231, 76, 60],
      [26, 188, 156]
    ];
    _.each(this.columns(), function (columnName) {
      var rgb = colors.shift().toString();
      
      this._colorDefaults[columnName] = {
        strokeColor: "rgba(" + rgb + ",0.75)",
        fillColor: "rgba(" + rgb + ",0.75)",
        highlightFill: "rgba(" + rgb + ",1)",
        highlightStroke: "rgba(255,255,255,1)"
      };
    }.bind(this));
  }

  return this._colorDefaults;
};

Dashboard.prototype.breakOutDataByDate = function (rawData) {
  var dates = _.map(rawData, 'date');

  // build object with dates as keys
  var dataByDate = {};
  dates.forEach(function (date) {
    var dateInfo = dataByDate[date] = {};
  
    rawData.forEach(function (blob) {
      if (blob.date === date) {
        var flowerInfo = dateInfo[blob.flower] = {};
        var quantSold = parseInt(blob['quantity-sold'], 10);
        var quantRemaining = parseInt(blob['quantity-unsold'], 10);
        var startingInventory = quantSold + quantRemaining;
        
        flowerInfo.sold = quantSold;
        flowerInfo.remaining = quantRemaining;
        flowerInfo.received = startingInventory;
      }
    });
  });
  
  this.addTotals(dataByDate);
  
  return dataByDate;
};

Dashboard.prototype.addTotals = function (dataByDate) {
  _.forIn(dataByDate, function (dateBlob) {
    var total = dateBlob['combined unit'] = {};
    _.forIn(dateBlob, function (flowerBlob, flowerName) {
      if (flowerName === 'combined unit') return;
      _.forIn(flowerBlob, function (value, attrName) {
        if (!total[attrName]) total[attrName] = 0;
        total[attrName] += value;
      });
    });
  });
};

Dashboard.prototype.labels = function () {
  return _.keys(this.dataByDate);
};

Dashboard.prototype.dateStrings = function () {
  return _.map(this.labels(), function (label) { 
    return new Date(label).toDateString();
  });
};

Dashboard.prototype.chartData = function () {  
  return {
    labels: this.dateStrings(),
    datasets: this.datasetArr()
  };
};

Dashboard.prototype.renderChart = function () {
  // empty contents of this.el if it has contents
  while (this.el.firstChild) {
    this.el.removeChild(this.el.firstChild);
  }
  
  // create a new canvas element to avoid stacking charts on top of one another.
  var canvas = document.createElement('canvas');
  canvas.height = this.el.offsetHeight;
  canvas.width = this.el.offsetWidth;
  this.el.appendChild(canvas);
  
  var ctx = canvas.getContext('2d');
  new Chart(ctx).Bar(this.chartData(), this.chartOptions());
  return this;
};

Dashboard.prototype.renderDetails = function () {
  this.details.innerHTML = '';
  
  var data = this.chartData();
  var labels = data.labels;
  var datasets = data.datasets;
  var percent = (this.currentView.showPercent ? 'percent' : '');
  
  var details = {
    startOfPeriod: labels[0],
    endOfPeriod: labels[labels.length - 1]
  };
  
  _.each(datasets, function (dataset) {
    var total = dataset.data.reduce(function (sum, n) { return sum += n; });
    var avg = total / dataset.data.length;
    
    var max = Math.max.apply(null, dataset.data);
    var bestDay = labels[dataset.data.indexOf(max)];
    
    var li = Dashboard.detailTemplate({
      dataset: dataset,
      percent: percent,
      details: _.merge({
        total: total,
        avg: avg,
        max: max,
        bestDay: bestDay
      }, details)
    });
    
    $li = $(li);
    $li.hide();
    this.details.appendChild($li[0]);
    $li.fadeIn();

  }.bind(this));
};

Dashboard.prototype.buildDatasetForColumn = function (column) {
  var scale = ( this.currentView.showPercent ? 
        'percent of starting inventory' : 'real units' );
  var property = this.currentView.property;
  
  // pluralize flower name
  // if (column !== 'combined unit') column += 's';
  var dataset = _.assign({ 
    label: column + 's ' + property,
    data: []
  }, this.colorDefaults()[column]);
  
  this.labels().forEach(function (label) {
    var dateBlob = this.dataByDate[label];
    var value = dateBlob[column][this.currentView.property];
    
    if (this.currentView.showPercent) {
      value = value / dateBlob[column].received * 100;
    }
    dataset.data.push(value);
  }.bind(this));
  
  return dataset;
};

Dashboard.prototype.datasetArr = function () {
  if (this.currentView.showCombined) {
    return [this.buildDatasetForColumn('combined unit')];
  } else {
    return _.map(this.flowers(), function (flower) {
      return this.buildDatasetForColumn(flower);
    }.bind(this));
  }
};

Dashboard.prototype.updateView = function (viewOptions) {
  _.assign(this.currentView, viewOptions);
  this.renderChart();
  this.details.innerHTML = '';
};
