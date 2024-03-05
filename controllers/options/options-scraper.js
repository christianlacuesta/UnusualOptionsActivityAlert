const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const settings = require('../../helpers/settings');
const fs = require('fs');


const url = settings.websites.optionStrat;
const path = settings.path.downloadPath + 'downloadedPage.html';

const parseData = ($) => {
    const bullishData = [];
    const bearishData = [];

    // Extract bullish flows
    $('.FlowOverviewContainer_container__VTrro .FlowOverviewBar_row--bullish__QUpXX').each((i, elem) => {

      const symbol = $(elem).find('.FlowOverviewBar_row__symbol__XwG74').text().trim();
      const name = $(elem).find('.FlowOverviewBar_row__name__ej6nh div').text().trim();
      const count = $(elem).find('.FlowOverviewBar_row__count__bBvCx').text().trim();
      const premium = $(elem).find('.FlowOverviewBar_row__premium__ahPrj').text().trim();
      bullishData.push({ symbol, name, count, premium });
    });
  
    // Extract bearish flows
    $('.FlowOverviewContainer_container__VTrro .FlowOverviewBar_row--bearish__m1SuX').each((i, elem) => {
      const symbol = $(elem).find('.FlowOverviewBar_row__symbol__XwG74').text().trim();
      const name = $(elem).find('.FlowOverviewBar_row__name__ej6nh div').text().trim();
      const count = $(elem).find('.FlowOverviewBar_row__count__bBvCx').text().trim();
      const premium = $(elem).find('.FlowOverviewBar_row__premium__ahPrj').text().trim();
      bearishData.push({ symbol, name, count, premium });
    });
  
    // console.log("Bullish Data:", bullishData);
    // console.log("Bearish Data:", bearishData);

    return {bullishData: bullishData, bearishData: bearishData};
}

const downloadFullHtml = async (url) => {
  try {
    // Launch the browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Go to the URL
    await page.goto(url, {waitUntil: 'networkidle2'}); // Waits for the network to be idle (no more than 2 connections for at least 500 ms).
    
    // Wait for the page to render completely
    const content = await page.content(); // Gets the full HTML content of the page, including dynamically generated elements.

    // Process the content or save it to a file

    await browser.close(); // Close the browser

    return content; // For demonstration purposes, we're logging the content. You can save it to a file instead.
    
  } catch (error) {
    console.error('Error downloading the fully loaded HTML:', error);
  }
}

const parsePremiumValue = (premiumString) => {
  if (premiumString.endsWith('k')) {
      return 0; // Entries with 'k' are considered as not meeting the threshold
  }
  return parseFloat(premiumString.replace('$', '').replace('m', ''));
};

// Function to filter data based on premium value
const filterDataByPremium = (data, threshold) => {
  return data.filter(item => parsePremiumValue(item.premium) >= threshold);
};

let transporter = nodemailer.createTransport({
  service: 'gmail', // for example, Gmail. You can use other services as well
  auth: {
    user: 'REPLACE WITH YOUR EMAIL', // your email address
    pass: 'REPLACE WITH YOUR PASSWORD' // your email password
  }
});

// Set up email data with unicode symbols
let mailOptions = {
  from: '"Unusual Options Activity" <unusualoptionsalert@gmail.com>', // sender address
  to: 'REPLACE WITH YOUR EMAIL', // list of receivers
  subject: 'Options Alert', // Subject line
  text: 'Hello world?', // plain text body
  html: '<b>Hello world?</b>' // html body
};

exports.getOptionsData = async (req, res, next) => {

  const content = await downloadFullHtml(url);

 fs.writeFile(path, content, (err) => {
    if (err) {
      console.error('Error writing the file:', err);
    } else {

      console.log('File saved: ' + path);

      fs.readFile(path, 'utf8', (err, html) => {
        if (err) {
          console.error('Error reading the HTML file:', err);
          return;
        }
        const $ = cheerio.load(html);

        const parsedData = parseData($);

        const jsonData = parsedData;
        const threshold = 3; // Threshold in millions for both bullish and bearish data
    
        const bullishData = filterDataByPremium(jsonData.bullishData, threshold);
        const bearishData = filterDataByPremium(jsonData.bearishData, threshold);

        const emailContent = `
        <h1>Filtered Bullish and Bearish Data</h1>
        <h2>Bullish:</h2>
        <pre>${JSON.stringify(bullishData, null, 2)}</pre>
        <h2>Bearish:</h2>
        <pre>${JSON.stringify(bearishData, null, 2)}</pre>
        `;

        mailOptions.html = emailContent;

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          console.log('Message sent: %s', info.messageId);
          // Preview only available when sending through an Ethereal account
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        });
    
        //res.status(200).json({bullishData: bullishData, bearishData: bearishData});
      });
    }
  });

};

exports.getOptionsData2 = async (req, res, next) => {

  const content = await downloadFullHtml(url);

 fs.writeFile(path, content, (err) => {
    if (err) {
      console.error('Error writing the file:', err);
    } else {

      console.log('File saved: ' + path);

      fs.readFile(path, 'utf8', (err, html) => {
        if (err) {
          console.error('Error reading the HTML file:', err);
          return;
        }
        const $ = cheerio.load(html);

        const parsedData = parseData($);

        const jsonData = parsedData;
        const threshold = 3; // Threshold in millions for both bullish and bearish data
    
        const bullishData = filterDataByPremium(jsonData.bullishData, threshold);
        const bearishData = filterDataByPremium(jsonData.bearishData, threshold);

    
        res.status(200).json({bullishData: bullishData, bearishData: bearishData});
      });
    }
  });

};