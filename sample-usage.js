"use strict";
const apexCleanup = require('apex-class-cleanup');

const options = {
    user: ' ',
    password: ' ',
    securityToken: ' ',
    loginUrl: 'https://test.salesforce.com',
    classesFolder: 'y:/path/to/folder/of/classes',
    noPrompt: false, // set to true to bypass the safety prompt and automatically delete classes
    // logLevel: 'DEBUG', // optional logging level passed to jsforce connection
    // version: '38.0' // optional salesforce api version
    // if you have already cached a connection to SF, bypass calling "login" again by passing your credentials below
    accessToken: null,
    instanceUrl: null
};

// delete apex classes not found in classes folder
apexCleanup
    .deleteExtraApex(options)
    .catch(errorContent => console.error('delete extra apex failure', errorContent));

// generate destructive changes xml file to delete apex classes not found in classes folder
/*
apexCleanup
    .generateXml(options)
    .then(xmlContent => console.log(xmlContent))  // write this to filesystem as needed
    .catch(errorContent => console.error('generateXml failed', errorContent));
*/