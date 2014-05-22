$(function(){

    /* Main */
    var pageSlider = $("main.container").royalSlider({
        sliderDrag          : false,
        sliderTouch         : false,
        navigateByClick     : false
    }).data('royalSlider');

    pageSlider.ev.on('rsAfterSlideChange', function(event) {
        var $slide = $(pageSlider.currSlide.content.get(0)),
            target = $slide.attr('id'),
            $nav = $('#fixed-footer a[href=#' + target + ']');

        $('#fixed-footer a').removeClass('selected');
        $nav.addClass('selected');
    });

    $(document).on('click touchstart', '.link', function(e){
        e.preventDefault();
        var $this = $(this),
            $target = $($this.attr('href')).parent(),
            index = $target.index();

        pageSlider.goTo(index);

        $('#fixed-footer a').removeClass('selected');
        $('#fixed-footer a[href=' + $this.attr('href') + ']').addClass('selected');
    });

    /* Workouts slider */
    var workoutsSlider = $(".workouts-slider").royalSlider({
        sliderDrag          : false,
        sliderTouch         : false,
        navigateByClick     : false
    }).data('royalSlider');

    workoutsSlider.ev.on('rsAfterSlideChange', function(event) {
        var $slide = $(workoutsSlider.currSlide.content.get(0)),
            target = $slide.attr('id'),
            $nav = $('.workout-pagination a[href=#' + target + ']');

        $('.workout-pagination a').removeClass('selected');
        $nav.addClass('selected');
    });

    $(document).on('click touchstart', '.workout-link', function(e){
        e.preventDefault();
        var $this = $(this),
            $target = $($this.attr('href')).parent(),
            index = $target.index();

        workoutsSlider.goTo(index);

        $('.workout-pagination a').removeClass('selected');
        $('.workout-pagination a[href=' + $this.attr('href') + ']').addClass('selected');
    });

    var app = {};
    app.webdb = {};
    app.webdb.db = null;

    app.webdb.open = function() {
      var dbSize = 5 * 1024 * 1024; // 5MB
      app.webdb.db = openDatabase("gym-tracker", "1", "Gym Tracker", dbSize);
    }

    app.webdb.onError = function(tx, e) {
      alert("There has been an error: " + e.message);
    }

    app.webdb.createTable = function() {
      var db = app.webdb.db;
      db.transaction(function(tx){
        tx.executeSql("CREATE TABLE IF NOT EXISTS workouts(ID INTEGER PRIMARY KEY ASC, start_time int, end_time int)", []);
      });
    }

    $('.workout-toggle').on('mousedown touchstart', function(e){
        e.preventDefault();
        app.webdb.checkRunningSession();
    });

    app.webdb.startSession = function(tx, data) {
        var db = app.webdb.db;
        db.transaction(function(tx){
            var addedOn = new Date();
            tx.executeSql("INSERT INTO workouts(start_time) VALUES (?)", [new Date().getTime()], app.webdb.loadData, app.webdb.onError);
        });

        $('#timer').removeClass('paused').addClass('running');
        $('.workout-toggle').text('Stop Workout');
    };

    app.webdb.endSession = function(tx, data) {
        var db = app.webdb.db;
        db.transaction(function(tx){
            var addedOn = new Date();
            tx.executeSql("UPDATE workouts SET end_time=? WHERE end_time IS NULL", [new Date().getTime()], app.webdb.loadData, app.webdb.onError);
        });

        $('#timer').removeClass('running').addClass('paused');
        $('.workout-toggle').text('Start Workout');
    };

    app.webdb.sessionToggle = function(tx, data) {
        (data.rows.length > 0)
            ? app.webdb.endSession()
            : app.webdb.startSession()
    };

    app.webdb.checkRunningSession = function(tx, r) {
        var db = app.webdb.db;
        db.transaction(function(tx) {
            tx.executeSql("SELECT id FROM workouts WHERE end_time IS NULL", [], app.webdb.sessionToggle, app.webdb.onError);
        });
    };

    app.webdb.loadData = function(tx, r) {
        var db = app.webdb.db;
        db.transaction(function(tx) {
            tx.executeSql("SELECT * FROM workouts ORDER BY start_time DESC", [], app.webdb.output, app.webdb.onError);
        });
    };

    app.webdb.output = function(tx, data) {
        html = '';
        for (var i=0; i < data.rows.length; i++) {
            var item = data.rows.item(i),
                startDate = new Date(item.start_time),
                endDate = new Date(item.end_time);

            var timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
            var diffHours = Math.floor(timeDiff / (1000 * 3600));
            var diffMinutes = Math.ceil(timeDiff / (1000 * 60) - (diffHours * 60));

            var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

            html += '<tr>' +
                '<td>' + startDate.getDay() + ' ' + monthNames[startDate.getMonth()] + ' ' + startDate.getHours() + ':' + startDate.getMinutes() + '</td>' +
                '<td>' + (item.end_time ? diffHours + ' hours, ' + diffMinutes + ' minutes' : 'In progress') + '</td>' +
            '</tr>';
        };

        $('#workouts').find('tbody').html(html);
    };

    var chartData = generateChartData();
    var chart = AmCharts.makeChart("chartdiv", {
        "type": "serial",
        "theme": "light",
        "pathToImages": "http://www.amcharts.com/lib/3/images/",
        "dataProvider": chartData,
        "valueAxes": [{
            "axisAlpha": 0.2,
            "dashLength": 1,
            "position": "left"
        }],
        "graphs": [{
            "id":"g1",
            "balloonText": "[[category]]<br /><b><span style='font-size:14px;'>value: [[value]]</span></b>",
            "bullet": "round",
            "bulletBorderAlpha": 1,
            "bulletColor":"#FFFFFF",
            "hideBulletsCount": 50,
            "title": "red line",
            "valueField": "visits",
            "useLineColorForBulletBorder":true
        }],
        "chartScrollbar": {
            "autoGridCount": true,
            "graph": "g1",
            "scrollbarHeight": 40
        },
        "chartCursor": {
            "cursorPosition": "mouse"
        },
        "categoryField": "date",
        "categoryAxis": {
            "parseDates": true,
            "axisColor": "#DADADA",
            "dashLength": 1,
            "minorGridEnabled": true
        },
        "exportConfig":{
          menuRight: '20px',
          menuBottom: '30px',
          menuItems: [{
          icon: 'http://www.amcharts.com/lib/3/images/export.png',
          format: 'png'
          }]
        }
    });

    chart.addListener("rendered", zoomChart);
    zoomChart();

    // this method is called when chart is first inited as we listen for "dataUpdated" event
    function zoomChart() {
        // different zoom methods can be used - zoomToIndexes, zoomToDates, zoomToCategoryValues
        chart.zoomToIndexes(chartData.length - 40, chartData.length - 1);
    }


    // generate some random data, quite different range
    function generateChartData() {
        var chartData = [];
        var firstDate = new Date();
        firstDate.setDate(firstDate.getDate() - 5);

        for (var i = 0; i < 1000; i++) {
            // we create date objects here. In your data, you can have date strings
            // and then set format of your dates using chart.dataDateFormat property,
            // however when possible, use date objects, as this will speed up chart rendering.
            var newDate = new Date(firstDate);
            newDate.setDate(newDate.getDate() + i);

            var visits = Math.round(Math.random() * (40 + i / 5)) + 20 + i;

            chartData.push({
                date: newDate,
                visits: visits
            });
        }
        return chartData;
    }

    app.webdb.open();
    app.webdb.createTable();
    app.webdb.loadData();

});
