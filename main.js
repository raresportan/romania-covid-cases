(function () {

    const counties = {
        "AB": "Alba",
        "AR": "Arad",
        "AG": "Arges",
        "BC": "Bacau",
        "BH": "Bihor",
        "BN": "Bistrita-Nasaud",
        "BT": "Botosani",
        "BV": "Brasov",
        "BR": "Braila",
        "BZ": "Buzau",
        "CS": "Caras-Severin",
        "CL": "Calarasi",
        "CJ": "Cluj",
        "CT": "Constanta",
        "CV": "Covasna",
        "DB": "Dambovita",
        "DJ": "Dolj",
        "GL": "Galati",
        "GR": "Giurgiu",
        "GJ": "Gorj",
        "HR": "Harghita",
        "HD": "Hunedoara",
        "IL": "Ialomita",
        "IS": "Iasi",
        "IF": "Ilfov",
        "MM": "Maramures",
        "MH": "Mehedinti",
        "MS": "Mures",
        "NT": "Neamt",
        "OT": "Olt",
        "PH": "Prahova",
        "SM": "Satu Mare",
        "SJ": "Salaj",
        "SB": "Sibiu",
        "SV": "Suceava",
        "TR": "Teleorman",
        "TM": "Timis",
        "TL": "Tulcea",
        "VS": "Vaslui",
        "VL": "Valcea",
        "VN": "Vrancea",
        "B": "Bucuresti",
        "-": "Unknown County"
    }

    const colors = [
        "rgba(255, 0, 0, 0.2)",
        "rgba(255, 0, 0, 0.4)",
        "rgba(255, 0, 0, 0.6)",
        "rgba(255, 0, 0, 0.8)",
        "rgba(255, 0, 0, 1)"
    ];

    const bigChartOptions = {
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

    const smallChartOptions = {
        lineSmooth: true,
        seriesBarDistance: 0,
        width: 320,
        height: 200,
        low: 0,
        //high: 10000,
        showArea: true,
        axisX: {
            showLabel: false,
            showGrid: false
        }
    };

    const chartRefereces = {}

    const numberFormat = new Intl.NumberFormat();

    const sortByLabel = (a, b) => {
        const al = a && a.dataset ? a.dataset.label : a.label;
        const bl = b && b.dataset ? b.dataset.label : b.label;
        if (al < bl) {
            return -1;
        } else if (al > bl) {
            return 1;
        }
        return 0;
    }
    const sortByNewCases = (a, b) => (+b.dataset.newcases) - (+a.dataset.newcases);
    const sortByTotalCases = (a, b) => (+b.dataset.totalcases) - (+a.dataset.totalcases);
    let transformedData = null;
    let allTimeCases;
    let allTimeDiffs;


    // update status header
    const updateStatus = data => {
        const { newCases, numberInfected, numberCured, numberDeceased, lasUpdatedOn } = data;
        const status = document.querySelector('.status');
        status.innerHTML = `${numberFormat.format(numberInfected)} ${newCases ? '(+' + numberFormat.format(newCases) + ')' : ''} <span>infected</span> • ${numberFormat.format(numberCured)} <span>(${Math.round(numberCured / numberInfected * 100)}%) cured</span> • ${numberFormat.format(numberInfected - numberCured)} <span>active</span> • ${numberFormat.format(numberDeceased)} <span> (${Math.round(numberDeceased / numberInfected * 100)}%) deceased</span>`;

        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const headerSpan = document.querySelectorAll('h1 span')[1];
        headerSpan.innerHTML = `on ${new Date(lasUpdatedOn * 1000).toLocaleDateString(undefined, options)}`
    }


    // transform received data in what UI needs
    const transform = data => {
        const countyKeys = Object.keys(counties)
        const countyInfectionsNumbers = data.currentDayStats.countyInfectionsNumbers;
        const historicalDataKeys = Object.keys(data.historicalData).filter(key => data.historicalData[key].countyInfectionsNumbers)
        const historicalData = historicalDataKeys
            .sort() // by date
            .map(key => data.historicalData[key].countyInfectionsNumbers)

        const casesData = {};
        countyKeys.forEach(ck => {
            casesData[ck] = [];
            historicalData.forEach(hd => casesData[ck].push(hd[ck] || 0))
            casesData[ck].push(countyInfectionsNumbers[ck] || 0);
        })

        const sortData = {};
        countyKeys.forEach(ck => {
            const last = casesData[ck].slice(-2);
            const diff = last[1] - last[0];

            const caseDiffs = casesData[ck].map((x, i) => {
                if (i === 0) return 0;
                else {
                    return Math.max(x - casesData[ck][i - 1], 0);
                }
            });

            sortData[ck] = {
                key: ck,
                label: counties[ck],
                cases: [...casesData[ck]],
                caseDiffs: caseDiffs,
                newCases: diff,
                totalCases: last[1]
            }
        })
        return sortData;
    }


    // create the DOM for the entire contry cases
    const createAllCasesDOM = cases => {
        const allTimeContainer = document.querySelector('.allTimeCases');
        const allTimeArticle = document.createElement('article');
        const chartDiv = document.createElement('div');
        chartDiv.className = 'ct-chart-romania';
        allTimeArticle.appendChild(chartDiv);

        allTimeContainer.appendChild(allTimeArticle);

        const data = {
            series: [
                [...cases]
            ]
        };
        chartRefereces['all'] = new Chartist.Line('.ct-chart-romania', data, bigChartOptions);
    }


    // create DOM elements for data
    const createDOM = (sortData) => {
        const container = document.querySelector('.counties');
        container.innerHTML = '';
        sortData.forEach(sd => {
            const { newCases, totalCases, label, key } = sd;
            const svg = document.getElementById(key);
            if (svg) {
                let totalCasesColor = colors[0];
                if (totalCases > 500) {
                    totalCasesColor = colors[1]
                }
                if (totalCases > 1000) {
                    totalCasesColor = colors[2];
                }
                if (totalCases > 2000) {
                    totalCasesColor = colors[3]
                }
                if (totalCases > 4000) {
                    totalCasesColor = colors[4]
                }

                let newCasesColor = colors[0];
                if (newCases === 0) {
                    newCasesColor = 'rgba(144, 238, 144, 0.8)'
                }
                if (newCases > 10) {
                    newCasesColor = colors[1]
                }
                if (newCases > 50) {
                    newCasesColor = colors[2];
                }
                if (newCases > 100) {
                    newCasesColor = colors[3]
                }
                if (newCases > 200) {
                    newCasesColor = colors[4]
                }
                svg.style.fill = newCasesColor;
                svg.dataset.totalCasesColor = totalCasesColor;
                svg.dataset.newCasesColor = newCasesColor;
                svg.dataset.label = sd.label;
                svg.dataset.newcases = newCases;
                svg.dataset.totalcases = totalCases;
            }


            let article = document.querySelector(`article[data-label="${sd.label}"]`);
            let header;
            if (!article) {
                article = document.createElement('article');
                article.dataset.label = sd.label;

                header = document.createElement('header');
                article.appendChild(header);

                const chartDiv = document.createElement('div');
                chartDiv.className = 'ct-chart-' + key.toLowerCase();
                article.appendChild(chartDiv);
                container.appendChild(article);

            }
            article.dataset.newcases = newCases;
            article.dataset.totalcases = totalCases;
            header.innerHTML = label + '<span>' + new Intl.NumberFormat().format(totalCases) + (newCases ? '  (+' + new Intl.NumberFormat().format(newCases) + ')' : '') + '</span>';

            const data = {
                series: [
                    [...sd.caseDiffs]
                ]
            };

            chartRefereces[key.toLowerCase()] = new Chartist.Line('.ct-chart-' + key.toLowerCase(), data, smallChartOptions);
        })
    }


    const sortDataBy = sortBy => {
        const arr = Object.keys(transformedData).map(k => transformedData[k]);
        const sortedData = arr.sort(sortBy)

        createAllCasesDOM(allTimeDiffs);
        createDOM(sortedData);
    }

    // use data 
    const use = data => {
        transformedData = transform(data);
        const newCases = Object.keys(transformedData).reduce((acc, current) => {
            return acc + transformedData[current].newCases
        }, 0);

        const { numberInfected, numberCured, numberDeceased } = data.currentDayStats;
        updateStatus({
            newCases,
            numberInfected,
            numberCured,
            numberDeceased,
            lasUpdatedOn: data.lasUpdatedOn
        });
        document.querySelector('.sort').style.display = 'flex';

        const sortedData = Object.keys(transformedData).map(k => transformedData[k]);

        allTimeCases = sortedData.reduce((acc, current) => {
            if (acc.length === 0) {
                return [...current.cases]
            } else {
                return acc.map((x, i) => x + (current.cases[i] || 0))
            }
        }, [])

        allTimeDiffs = sortedData.reduce((acc, current) => {
            if (acc.length === 0) {
                return [...current.caseDiffs]
            } else {
                return acc.map((x, i) => x + (current.caseDiffs[i] || 0))
            }
        }, [])

        createAllCasesDOM(allTimeDiffs);
        createDOM(sortedData);

    }


    // sort county data
    const sort = selection => {
        let compareFunction;
        switch (selection) {
            case "newcases":
                compareFunction = sortByNewCases;
                break;
            case "totalcases":
                compareFunction = sortByTotalCases;
                break;
            default:
                compareFunction = sortByLabel

        }

        const articles = Array.from(document.querySelectorAll('.counties > article'))
        const sortedArticles = articles.sort(compareFunction)
        const container = document.querySelector('.counties')

        container.innerHTML = '';
        sortedArticles.forEach(a => {
            container.appendChild(a);

            const chartDiv = a.querySelector('div');
            const className = chartDiv.className;
            const key = /--/g.test(className) ? '-' : className.split('-').pop();
            let data = {};
            let allData = {}

            if (selection === 'newcases') {
                data = {
                    series: [
                        [...transformedData[key.toUpperCase()].caseDiffs]
                    ]
                };

                allData = {
                    series: [
                        [...allTimeDiffs]
                    ]
                };
            } else {
                data = {
                    series: [
                        [...transformedData[key.toUpperCase()].cases]
                    ]
                };
                allData = {
                    series: [
                        [...allTimeCases]
                    ]
                };
            }
            const chart = chartRefereces[key];
            chart.update(data, smallChartOptions);

            const bigChart = chartRefereces['all'];
            bigChart.update(allData, bigChartOptions)
        });

        const svgs = Array.from(document.querySelectorAll('.map > path'));
        svgs.forEach(s => {
            s.style.fill = selection === 'newcases' ? s.dataset.newCasesColor : s.dataset.totalCasesColor
        })
    }


    const highlight = e => {
        const target = e.target;
        const tooltip = document.getElementById('tooltip');
        if (target.dataset && target.dataset.label) {
            const label = target.dataset.label;
            const newcases = numberFormat.format(target.dataset.newcases);
            const totalcases = numberFormat.format(target.dataset.totalcases);

            target.style.opacity = '0.8'
            const { pageX, pageY } = event;
            const tooltip = document.getElementById('tooltip');
            tooltip.innerHTML = label + ' ' + totalcases + (newcases ? ' (+' + newcases + ')' : '')
            tooltip.style.top = (pageY - 60) + 'px'
            tooltip.style.left = (pageX - 60) + 'px'

        } else {
            tooltip.style.top = '-300px';
        }
    }


    const removeHighlight = e => {
        const target = e.target;
        target.style.opacity = '1'
    }


    const showCounty = e => {
        const target = e.target;
        if (target.dataset && target.dataset.label) {
            const label = target.dataset.label;
            console.log(label);
            const el = document.querySelector(`article[data-label="${label}"]`);
            console.log(el);
            if (el) {
                el.scrollIntoView({
                    behavior: 'smooth'
                })
            }
        }
    }

    const showError = (err) => {
        console.error(err)
        const status = document.querySelector('.status');
        status.innerHTML = `Error loading data`;
    }


    fetch('https://datelazi.ro/latestData.json')
        .then(result => result.json())
        .then(use)
        .catch(showError);


    window.traker = window.traker || {
        highlight,
        removeHighlight,
        showCounty,
        sort
    }

}())
