"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

(function () {
  var counties = {
    "AB": "Alba",
    "AR": "Arad",
    "AG": "Argeș",
    "BC": "Bacău",
    "BH": "Bihor",
    "BN": "Bistrița-Năsăud",
    "BT": "Botoșani",
    "BV": "Brașov",
    "BR": "Brăila",
    "BZ": "Buzău",
    "CS": "Caraș-Severin",
    "CL": "Călărași",
    "CJ": "Cluj",
    "CT": "Constanța",
    "CV": "Covasna",
    "DB": "Dâmbovița",
    "DJ": "Dolj",
    "GL": "Galați",
    "GR": "Giurgiu",
    "GJ": "Gorj",
    "HR": "Harghita",
    "HD": "Hunedoara",
    "IL": "Ialomița",
    "IS": "Iași",
    "IF": "Ilfov",
    "MM": "Maramureș",
    "MH": "Mehedinți",
    "MS": "Mureș",
    "NT": "Neamț",
    "OT": "Olt",
    "PH": "Prahova",
    "SM": "Satu Mare",
    "SJ": "Sălaj",
    "SB": "Sibiu",
    "SV": "Suceava",
    "TR": "Teleorman",
    "TM": "Timiș",
    "TL": "Tulcea",
    "VS": "Vaslui",
    "VL": "Vâlcea",
    "VN": "Vrancea",
    "B": "București",
    "-": "?"
  };
  var colors = ["rgba(255, 0, 0, 0.2)", "rgba(255, 0, 0, 0.4)", "rgba(255, 0, 0, 0.6)", "rgba(255, 0, 0, 0.8)", "rgba(255, 0, 0, 1)"];
  var bigChartOptions = {
    lineSmooth: true,
    low: 0,
    height: 400,
    //high: 10000,
    showArea: true,
    axisX: {
      showLabel: false,
      showGrid: false
    }
  };
  var smallChartOptions = {
    lineSmooth: true,
    seriesBarDistance: 0,
    width: 320,
    height: 200,
    low: 0,
    // high: 2000,
    showArea: true,
    axisX: {
      showLabel: false,
      showGrid: false
    }
  };
  var chartRefereces = {};
  var svgData = {};
  var numberFormat = new Intl.NumberFormat();

  var sortByNewCases = function sortByNewCases(a, b) {
    return +b.dataset.newcases - +a.dataset.newcases;
  };

  var sortByTotalCases = function sortByTotalCases(a, b) {
    return +b.dataset.totalcases - +a.dataset.totalcases;
  };

  var transformedData = null;
  var allTimeCases;
  var allTimeDiffs; // update status header

  var updateStatus = function updateStatus(data) {
    var newCases = data.newCases,
        numberInfected = data.numberInfected,
        numberCured = data.numberCured,
        numberDeceased = data.numberDeceased,
        lasUpdatedOn = data.lasUpdatedOn;
    var status = document.querySelector('.status');
    status.innerHTML = "".concat(numberFormat.format(numberInfected), " ").concat(newCases ? '(+' + numberFormat.format(newCases) + ')' : '', " <span>infected</span> \u2022 ").concat(numberFormat.format(numberCured), " <span>(").concat(Math.round(numberCured / numberInfected * 100), "%) cured</span> \u2022 ").concat(numberFormat.format(numberInfected - numberCured), " <span>active</span> \u2022 ").concat(numberFormat.format(numberDeceased), " <span> (").concat(Math.round(numberDeceased / numberInfected * 100), "%) deceased</span>");
    var options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    var headerSpan = document.querySelectorAll('h1 span')[1];
    headerSpan.innerHTML = "on ".concat(new Date(lasUpdatedOn).toLocaleDateString(undefined, options));
  }; // transform received data in what UI needs


  var transform = function transform(data) {
    var countyKeys = Object.keys(counties);
    var countyInfectionsNumbers = data.currentDayStats.countyInfectionsNumbers;
    var historicalDataKeys = Object.keys(data.historicalData).filter(function (key) {
      return data.historicalData[key].countyInfectionsNumbers;
    });
    var historicalData = historicalDataKeys.sort() // by date
    .map(function (key) {
      return data.historicalData[key].countyInfectionsNumbers;
    });
    var casesData = {};
    countyKeys.forEach(function (ck) {
      casesData[ck] = [];
      historicalData.forEach(function (hd) {
        return casesData[ck].push(hd[ck] || 0);
      });
      casesData[ck].push(countyInfectionsNumbers[ck] || 0);
    });
    var sortData = {};
    countyKeys.forEach(function (ck) {
      var last = casesData[ck].slice(-2);
      var diff = last[1] - last[0];
      var caseDiffs = casesData[ck].map(function (x, i) {
        if (i === 0) return 0;else {
          return Math.max(x - casesData[ck][i - 1], 0);
        }
      });
      sortData[ck] = {
        key: ck,
        label: counties[ck],
        cases: _toConsumableArray(casesData[ck]),
        caseDiffs: caseDiffs,
        newCases: diff,
        totalCases: last[1]
      };
    });
    return sortData;
  }; // create the DOM for the entire contry cases


  var createAllCasesDOM = function createAllCasesDOM(cases) {
    var allTimeContainer = document.querySelector('.allTimeCases');
    var allTimeArticle = document.createElement('article');
    var chartDiv = document.createElement('div');
    chartDiv.className = 'ct-chart-romania';
    allTimeArticle.appendChild(chartDiv);
    allTimeContainer.appendChild(allTimeArticle);
    var data = {
      series: [_toConsumableArray(cases)]
    };
    chartRefereces['all'] = new Chartist.Line('.ct-chart-romania', data, bigChartOptions);
  }; // create DOM elements for data


  var createDOM = function createDOM(sortData) {
    var container = document.querySelector('.counties');
    container.innerHTML = '';
    var articles = sortData.map(function (sd) {
      var newCases = sd.newCases,
          totalCases = sd.totalCases,
          label = sd.label,
          key = sd.key;
      var svg = document.getElementById(key);

      if (svg) {
        var totalCasesColor = colors[0];

        if (totalCases > 500) {
          totalCasesColor = colors[1];
        }

        if (totalCases > 1000) {
          totalCasesColor = colors[2];
        }

        if (totalCases > 2000) {
          totalCasesColor = colors[3];
        }

        if (totalCases > 4000) {
          totalCasesColor = colors[4];
        }

        var newCasesColor = colors[0];

        if (newCases === 0) {
          newCasesColor = 'rgba(144, 238, 144, 0.8)';
        }

        if (newCases > 10) {
          newCasesColor = colors[1];
        }

        if (newCases > 50) {
          newCasesColor = colors[2];
        }

        if (newCases > 100) {
          newCasesColor = colors[3];
        }

        if (newCases > 200) {
          newCasesColor = colors[4];
        }

        svg.style.fill = newCasesColor;
        svgData[key] = {
          totalCasesColor: totalCasesColor,
          newCasesColor: newCasesColor,
          label: sd.label,
          newCases: newCases,
          totalCases: totalCases
        };
      }

      var article = document.querySelector("article[data-label=\"".concat(sd.label, "\"]"));
      var header;

      if (!article) {
        article = document.createElement('article');
        article.dataset.label = sd.label;
        article.dataset.key = key.toLowerCase();
        header = document.createElement('header');
        article.appendChild(header);
        var chartDiv = document.createElement('div');
        chartDiv.className = 'ct-chart-' + key.toLowerCase();
        article.appendChild(chartDiv);
      }

      article.dataset.newcases = newCases;
      article.dataset.totalcases = totalCases;
      header.innerHTML = label + '<span>' + new Intl.NumberFormat().format(totalCases) + (newCases ? '  (+' + new Intl.NumberFormat().format(newCases) + ')' : '') + '</span>';
      var days = sd.caseDiffs.length;
      var caseDiffs = days > 100 ? sd.caseDiffs.filter(function (v, index) {
        return index > days - 100;
      }) : sd.caseDiffs;
      var data = {
        series: [_toConsumableArray(caseDiffs)]
      };
      article.data = data;
      return article;
    });
    var sortedArticles = articles.sort(sortByNewCases);
    sortedArticles.forEach(function (article) {
      container.appendChild(article);
      chartRefereces[article.dataset.key] = new Chartist.Line('.ct-chart-' + article.dataset.key, article.data, smallChartOptions);
    });
  }; // use data 


  var use = function use(data) {
    transformedData = transform(data);
    var lastCases = Object.keys(data.historicalData).reduce(function (acc, current) {
      return Math.max(acc, data.historicalData[current].numberInfected);
    }, 0);
    var newCases = data.currentDayStats.numberInfected - lastCases;
    var _data$currentDayStats = data.currentDayStats,
        numberInfected = _data$currentDayStats.numberInfected,
        numberCured = _data$currentDayStats.numberCured,
        numberDeceased = _data$currentDayStats.numberDeceased;
    updateStatus({
      newCases: newCases,
      numberInfected: numberInfected,
      numberCured: numberCured,
      numberDeceased: numberDeceased,
      lasUpdatedOn: data.currentDayStats.parsedOnString
    });

    if (!/Trident\/|MSIE/.test(window.navigator.userAgent)) {
      document.querySelector('.sort').style.display = 'flex';
    }

    var sortedData = Object.keys(transformedData).map(function (k) {
      return transformedData[k];
    });
    allTimeCases = sortedData.reduce(function (acc, current) {
      if (acc.length === 0) {
        return _toConsumableArray(current.cases);
      } else {
        return acc.map(function (x, i) {
          return x + (current.cases[i] || 0);
        });
      }
    }, []);
    allTimeDiffs = sortedData.reduce(function (acc, current) {
      if (acc.length === 0) {
        return _toConsumableArray(current.caseDiffs);
      } else {
        return acc.map(function (x, i) {
          return x + (current.caseDiffs[i] || 0);
        });
      }
    }, []);
    createAllCasesDOM(allTimeDiffs);
    createDOM(sortedData);
  }; // sort county data


  var sort = function sort(selection) {
    var compareFunction;

    switch (selection) {
      case "newcases":
        compareFunction = sortByNewCases;
        break;

      case "allcases":
        compareFunction = sortByTotalCases;
        break;
    }

    var articles = Array.prototype.slice.call(document.querySelectorAll('.counties > article'));
    var sortedArticles = articles.sort(compareFunction);
    var container = document.querySelector('.counties');
    container.innerHTML = '';
    sortedArticles.forEach(function (a) {
      container.appendChild(a);
      var key = a.dataset.key;
      var data = {
        series: []
      };
      data.series[0] = selection === 'newcases' ? _toConsumableArray(transformedData[key.toUpperCase()].caseDiffs.filter(function (v, index, arr) {
        return index > arr.length - 100;
      })) : _toConsumableArray(transformedData[key.toUpperCase()].cases);
      var chart = chartRefereces[key];
      chart.update(data, smallChartOptions);
    });
    var allData = {
      series: []
    };
    allData.series[0] = selection === 'newcases' ? _toConsumableArray(allTimeDiffs) : _toConsumableArray(allTimeCases);
    var bigChart = chartRefereces['all'];
    bigChart.update(allData, bigChartOptions);
    var svgs = Array.prototype.slice.call(document.querySelectorAll('.map > path'));
    svgs.forEach(function (s) {
      var data = svgData[s.id];
      s.style.fill = selection === 'newcases' ? data.newCasesColor : data.totalCasesColor;
    });
  };

  var highlight = function highlight(e) {
    var target = e.target;
    var tooltip = document.getElementById('tooltip');

    if (target.id) {
      var data = svgData[target.id];

      if (data) {
        var label = data.label;
        var newcases = numberFormat.format(data.newCases);
        var totalcases = numberFormat.format(data.totalCases);
        target.style.opacity = '0.8';
        var _event = event,
            pageX = _event.pageX,
            pageY = _event.pageY;

        var _tooltip = document.getElementById('tooltip');

        _tooltip.innerHTML = label + ' ' + totalcases + (newcases ? ' (+' + newcases + ')' : '');
        _tooltip.style.top = pageY - 60 + 'px';
        _tooltip.style.left = pageX - 60 + 'px';
      }
    } else {
      tooltip.style.top = '-300px';
    }
  };

  var removeHighlight = function removeHighlight(e) {
    var target = e.target;
    target.style.opacity = '1';
  };

  var showCounty = function showCounty(e) {
    var target = e.target;

    if (target.id) {
      var label = svgData[id].label;
      var el = document.querySelector("article[data-label=\"".concat(label, "\"]"));

      if (el) {
        el.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
  };

  var showError = function showError(err) {
    console.error(err);
    var status = document.querySelector('.status');
    status.innerHTML = "Error loading data";
  };

  fetch('https://datelazi.ro/_next/data/anOcTRuMkkoduIxsimMkE/index.json', {
    mode: 'no-cors'
  }).then(function (result) {
    return result.json();
  }).then(use)["catch"](showError);
  window.traker = window.traker || {
    highlight: highlight,
    removeHighlight: removeHighlight,
    showCounty: showCounty,
    sort: sort
  };
})();
