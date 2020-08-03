(function () {

    const counties = {
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
    const svgData = {}

    const numberFormat = new Intl.NumberFormat();
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

        const articles = sortData.map(sd => {
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

                svgData[key] = {
                    totalCasesColor,
                    newCasesColor,
                    label: sd.label,
                    newCases,
                    totalCases
                }
            }


            let article = document.querySelector(`article[data-label="${sd.label}"]`);
            let header;
            if (!article) {
                article = document.createElement('article');
                article.dataset.label = sd.label;
                article.dataset.key = key.toLowerCase();

                header = document.createElement('header');
                article.appendChild(header);

                const chartDiv = document.createElement('div');
                chartDiv.className = 'ct-chart-' + key.toLowerCase();
                article.appendChild(chartDiv);

            }
            article.dataset.newcases = newCases;
            article.dataset.totalcases = totalCases;
            header.innerHTML = label + '<span>' + new Intl.NumberFormat().format(totalCases) + (newCases ? '  (+' + new Intl.NumberFormat().format(newCases) + ')' : '') + '</span>';

            const data = {
                series: [
                    [...sd.caseDiffs]
                ]
            };

            article.data = data;
            return article;
        })

        const sortedArticles = articles.sort(sortByNewCases)
        sortedArticles.forEach(article => {
            container.appendChild(article);
            chartRefereces[article.dataset.key] = new Chartist.Line('.ct-chart-' + article.dataset.key, article.data, smallChartOptions);
        })
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

        if (!/Trident\/|MSIE/.test(window.navigator.userAgent)) {
            document.querySelector('.sort').style.display = 'flex';
        }

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
            case "allcases":
                compareFunction = sortByTotalCases;
                break;
        }

        const articles = Array.prototype.slice.call(document.querySelectorAll('.counties > article'))
        const sortedArticles = articles.sort(compareFunction)
        const container = document.querySelector('.counties')

        container.innerHTML = '';
        sortedArticles.forEach(a => {
            container.appendChild(a);

            const key = a.dataset.key;
            let data = { series: [] };
            data.series[0] = selection === 'newcases' ? [...transformedData[key.toUpperCase()].caseDiffs] : [...transformedData[key.toUpperCase()].cases]

            const chart = chartRefereces[key];
            chart.update(data, smallChartOptions);
        });

        let allData = { series: [] }
        allData.series[0] = selection === 'newcases' ? [...allTimeDiffs] : [...allTimeCases]
        const bigChart = chartRefereces['all'];
        bigChart.update(allData, bigChartOptions)


        const svgs = Array.prototype.slice.call(document.querySelectorAll('.map > path'));
        svgs.forEach(s => {
            const data = svgData[s.id];
            s.style.fill = selection === 'newcases' ? data.newCasesColor : data.totalCasesColor
        })
    }


    const highlight = e => {
        const target = e.target;
        const tooltip = document.getElementById('tooltip');
        if (target.id) {
            const data = svgData[target.id];
            if (data) {
                const label = data.label;
                const newcases = numberFormat.format(data.newCases);
                const totalcases = numberFormat.format(data.totalCases);

                target.style.opacity = '0.8'
                const { pageX, pageY } = event;
                const tooltip = document.getElementById('tooltip');
                tooltip.innerHTML = label + ' ' + totalcases + (newcases ? ' (+' + newcases + ')' : '')
                tooltip.style.top = (pageY - 60) + 'px'
                tooltip.style.left = (pageX - 60) + 'px'
            }

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
        if (target.id) {
            const label = svgData[id].label;
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
