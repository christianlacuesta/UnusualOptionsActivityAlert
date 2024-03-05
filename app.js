const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sequelize = require('./helpers/database');
const schedule = require('node-schedule');
const moment = require('moment'); // For easier date handling


const optionsScraperController = require('./controllers/options/options-scraper');

const holidays = ['01-01', '07-04', '12-25']; // New Year's Day, Independence Day, Christmas

function isHoliday(today) {
    const todayFormatted = moment(today).format('MM-DD');
    return holidays.includes(todayFormatted);
}

const app = express();

app.use(express.static(path.join(__dirname, 'files')));

app.use('/files', express.static(__dirname + '/files'));

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type', 'Authorization');
    next();
});

app.use('/api/options', optionsScraperRoutes);

// Schedule job to run every 20 minutes
const job = schedule.scheduleJob('*/20 * * * *', function(){
    const now = new Date();
    
    // Check if it's a weekday (Monday = 1, Sunday = 7) and time is between 7:00 AM to 3:00 PM
    if (now.getDay() >= 1 && now.getDay() <= 5 && !isHoliday(now) && now.getHours() >= 7 && now.getHours() < 15) {
      // Send email
      optionsScraperController.getOptionsData();
      console.log('Mail Sent');
    } else {
      console.log('Not a valid time or day to send an email.');
    }
});

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

sequelize.sync().then(result => {
    app.listen(8190);
})
.catch(err => {
    console.log(err);
});
  